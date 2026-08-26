/*
  图谱查询：POST /api/graph/query 的处理逻辑。
  - 带猫咪档案（age/weight/feeding 三个枚举值）：走 Profile 多跳推理，返回推荐链事实
  - 不带档案：从问题里抽取 Issue/关键词（配了 DEEPSEEK_API_KEY 用模型抽取，否则关键词兜底），
    返回关联 FAQ、产品和政策
  返回结构约定见 knowledge-base/graph-schema.md。
*/
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const env = {};
try {
  for (const line of fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !line.trim().startsWith("#")) env[m[1]] = m[2];
  }
} catch {}
const NEO4J_URL = (env.NEO4J_HTTP_URL || "http://localhost:7474").replace(/\/$/, "");
const NEO4J_PASSWORD = env.NEO4J_PASSWORD || "ninelives-graph-2026";
const DEEPSEEK_API_KEY = env.DEEPSEEK_API_KEY || "";

const ISSUES = ["挑食", "肠胃敏感", "毛发状态", "体重管理", "多猫省心"];
// 口语 → Issue 的关键词兜底映射
const ISSUE_HINTS = {
  挑食: ["挑食", "不吃", "不爱吃", "剩饭"],
  肠胃敏感: ["肠胃", "软便", "拉肚子", "腹泻", "吐"],
  毛发状态: ["毛发", "掉毛", "毛色"],
  体重管理: ["胖", "体重", "减肥", "超重"],
  多猫省心: ["多猫", "两只", "三只", "几只猫"],
};

async function cypher(statement, parameters = {}) {
  const res = await fetch(`${NEO4J_URL}/db/neo4j/tx/commit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`neo4j:${NEO4J_PASSWORD}`).toString("base64"),
    },
    body: JSON.stringify({ statements: [{ statement, parameters }] }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(JSON.stringify(json.errors));
  return json.results[0]?.data.map((d) => d.row) ?? [];
}

/** 把自由文本体重（"4kg" / "4公斤" / "4.2"）归一到 WeightRange 枚举 */
export function normalizeWeight(raw) {
  if (!raw) return "";
  const num = parseFloat(String(raw).replace(/[^\d.]/g, ""));
  if (!Number.isFinite(num)) return "";
  if (num <= 3) return "≤3kg";
  if (num <= 4) return "3-4kg";
  if (num <= 6) return "4-6kg";
  return "≥6kg";
}

/** 档案多跳推理：Profile → Issue → RECOMMENDED → Solution → Product（feeding 可缺省） */
async function queryByProfile(profile) {
  const hasFeeding = Boolean(profile.feeding);
  const rows = await cypher(
    `MATCH (a:AgeGroup {name: $age})-[:PROFILE_PART]->(p:Profile),
           (w:WeightRange {name: $weight})-[:PROFILE_PART]->(p)
     ${hasFeeding ? "MATCH (f:FeedingStyle {name: $feeding})-[:PROFILE_PART]->(p)" : ""}
     MATCH (p)-[:TYPICAL_ISSUE]->(i:Issue)-[r:RECOMMENDED]->(s:Solution)
     WHERE r.profileKey = p.key
     OPTIONAL MATCH (s)-[:INCLUDES]->(prod:Product)
     RETURN i.name AS issue, s.name AS solution, r.rate AS rate, r.sample AS sample,
            collect(DISTINCT prod.id) AS productIds
     ORDER BY rate DESC`,
    { age: profile.age, weight: profile.weight, feeding: profile.feeding ?? "" },
  );
  const facts = [];
  const productIds = new Set();
  const issues = new Set();
  const dims = [profile.age, profile.weight, profile.feeding].filter(Boolean).join(" + ");
  for (const [issue, solution, rate, sample, ids] of rows) {
    issues.add(issue);
    ids.forEach((id) => productIds.add(id));
    facts.push(
      `画像「${dims}」的猫咪典型问题为「${issue}」，推荐方案：${solution}（历史适应率 ${rate}%，样本 ${sample} 只）`,
    );
  }
  return { facts, productIds: [...productIds], issues: [...issues] };
}

/** 从问题中抽取 Issue（DeepSeek JSON 模式，失败/未配置则关键词兜底） */
async function extractIssues(query) {
  if (DEEPSEEK_API_KEY) {
    try {
      const res = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${DEEPSEEK_API_KEY}` },
        body: JSON.stringify({
          model: "deepseek-chat",
          response_format: { type: "json_object" },
          max_tokens: 128,
          temperature: 0,
          messages: [
            {
              role: "system",
              content: `你是宠物客服问题的意图抽取器。从用户问题中识别涉及的猫咪问题类型，只返回 JSON：{"issues": [...]}。issues 只能从以下枚举中选取（可多选，无则空数组）：${ISSUES.join("、")}。不要输出任何其他内容。`,
            },
            { role: "user", content: query },
          ],
        }),
      });
      const json = await res.json();
      const parsed = JSON.parse(json.choices?.[0]?.message?.content ?? "{}");
      if (Array.isArray(parsed.issues)) return parsed.issues.filter((i) => ISSUES.includes(i));
    } catch {
      // 落回关键词
    }
  }
  return ISSUES.filter((issue) => ISSUE_HINTS[issue].some((kw) => query.includes(kw)));
}

/** 按 Issue 查关联 FAQ / 产品 / 政策 */
async function queryByIssues(issues, query) {
  const KWS = ["退", "配送", "冷链", "保存", "换粮", "喂", "猫砂", "梳毛", "玩具", "猫窝", "用品", "掉毛", "新手"];
  const extraKws = KWS.filter((k) => query.includes(k));
  const textNeed = extraKws.length > 0;
  if (issues.length === 0 && !textNeed) return { facts: [], productIds: [], faqs: [] };

  const faqRows = [];
  const prodRows = [];
  if (issues.length > 0) {
    faqRows.push(...(await cypher(
      `MATCH (f:FAQ)-[:ABOUT]->(i:Issue) WHERE i.name IN $issues
       OPTIONAL MATCH (f)-[:ANSWERED_BY]->(po:Policy)
       RETURN f.q AS q, f.a AS a, collect(DISTINCT po.name) AS policies LIMIT 5`,
      { issues },
    )));
    prodRows.push(...(await cypher(
      `MATCH (p:Product)-[:SUITABLE_FOR]->(i:Issue) WHERE i.name IN $issues
       RETURN DISTINCT p.id AS id`,
      { issues },
    )));
  }

  // 政策 / 用品类问题：FAQ 文本匹配 + 商品标题匹配（不依赖 Issue 关联）
  if (textNeed) {
    faqRows.push(...(await cypher(
      `MATCH (f:FAQ)
       WHERE any(kw IN $kws WHERE f.q CONTAINS kw OR f.a CONTAINS kw)
       RETURN DISTINCT f.q AS q, f.a AS a, [] AS policies LIMIT 5`,
      { kws: extraKws },
    )));
    prodRows.push(...(await cypher(
      `MATCH (p:Product)
       WHERE any(kw IN $kws WHERE p.title CONTAINS kw OR p.tag CONTAINS kw)
       RETURN DISTINCT p.id AS id`,
      { kws: extraKws },
    )));
  }

  const seen = new Set();
  const faqs = faqRows
    .filter(([q]) => (seen.has(q) ? false : seen.add(q)))
    .map(([q, a, policies]) => ({ q, a, policies }));
  return { facts: [], productIds: [...new Set(prodRows.map(([id]) => id))], faqs };
}

async function productDetails(ids) {
  if (ids.length === 0) return [];
  const rows = await cypher(
    `MATCH (p:Product) WHERE p.id IN $ids RETURN p.id AS id, p.title AS title, p.tag AS tag, p.price AS price`,
    { ids },
  );
  return rows.map(([id, title, tag, price]) => ({ id, title, tag, price }));
}

/** 纯查询函数：供 HTTP 路由和聊天代理注入复用 */
export async function graphQuery({ query = "", profile } = {}) {
  let facts = [];
  let productIds = [];
  let faqs = [];
  let issues = [];

  const normalized = profile
    ? { age: profile.age, weight: normalizeWeight(profile.weight) || profile.weight, feeding: profile.feeding }
    : null;

  if (normalized?.age && normalized?.weight) {
    const r = await queryByProfile(normalized);
    facts = r.facts;
    productIds = r.productIds;
    issues = r.issues;
  }
  // 有问题文本时，同时做意图抽取补充 FAQ
  if (query) {
    const detected = await extractIssues(query);
    const merged = [...new Set([...issues, ...detected])];
    const r = await queryByIssues(merged, query);
    facts = [...facts, ...r.facts];
    productIds = [...new Set([...productIds, ...r.productIds])];
    faqs = r.faqs;
  }

  return { facts, products: await productDetails(productIds), related_faq: faqs };
}

export async function handleGraphQuery(req, res, sendJson) {
  try {
    let body = "";
    req.on("data", (c) => (body += c));
    await new Promise((r) => req.on("end", r));
    const { query = "", profile } = JSON.parse(body || "{}");
    sendJson(res, 200, await graphQuery({ query, profile }));
  } catch (err) {
    sendJson(res, 500, { error: String(err) });
  }
}
