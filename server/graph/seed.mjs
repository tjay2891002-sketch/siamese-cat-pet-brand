/*
  图谱建库脚本：把 site.ts 的推荐矩阵/产品/套餐 + knowledge-base/05-FAQ.md 灌入 Neo4j。
  Schema 见 knowledge-base/graph-schema.md（Profile 组合画像节点已物化）。
  运行：node server/graph/seed.mjs   （幂等，全部 MERGE，可重复执行）
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

async function cypher(statements) {
  const res = await fetch(`${NEO4J_URL}/db/neo4j/tx/commit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`neo4j:${NEO4J_PASSWORD}`).toString("base64"),
    },
    body: JSON.stringify({ statements }),
  });
  const json = await res.json();
  if (json.errors?.length) throw new Error(JSON.stringify(json.errors));
  return json;
}

// ---- 从 site.ts 提取推荐矩阵 ----
const siteTs = fs.readFileSync(path.join(root, "src/data/site.ts"), "utf8");
const matrix = [];
const rowRe = /\{ age: "([^"]+)", weight: "([^"]+)", feeding: "([^"]+)", issue: "([^"]+)", rate: (\d+), sample: (\d+), plan: "([^"]+)" \}/g;
let m;
while ((m = rowRe.exec(siteTs))) {
  matrix.push({ age: m[1], weight: m[2], feeding: m[3], issue: m[4], rate: Number(m[5]), sample: Number(m[6]), plan: m[7] });
}
if (matrix.length === 0) throw new Error("未能从 site.ts 提取 recommendationMatrix");

// ---- 从 FAQ 文档提取问答对 ----
const faqMd = fs.readFileSync(path.join(root, "knowledge-base/05-FAQ.md"), "utf8");
const faqs = [];
const qaRe = /\*\*Q：(.+?)\*\*\s*\nA：(.+?)(?=\n\n|\n\*\*Q|$)/gs;
while ((m = qaRe.exec(faqMd))) {
  faqs.push({ q: m[1].trim(), a: m[2].trim().replace(/\n/g, " ") });
}

// ---- 产品/套餐（id 与 site.ts 对齐） ----
const products = [
  { id: "fresh-chicken-starter", title: "原切鸡肉温煮餐", tag: "鲜食主餐", price: "新人试吃 ¥39 起" },
  { id: "freeze-dried-gut", title: "冻干肠胃小方", tag: "功能零食", price: "测评后推荐" },
  { id: "lazy-cat-kit", title: "懒猫午睡套装", tag: "生活用品", price: "组合省心购" },
  { id: "duck-warm-meal", title: "鸭肉温补餐", tag: "鲜食主餐", price: "新人试吃 ¥45 起" },
  { id: "rabbit-lowallergen", title: "兔肉低敏餐", tag: "鲜食主餐", price: "新人试吃 ¥49 起" },
  { id: "grooming-kit", title: "梳毛护理套装", tag: "生活用品", price: "随餐凑单 ¥69 起" },
  { id: "litter-toy-kit", title: "猫砂玩具启蒙包", tag: "生活用品", price: "随餐凑单 ¥89 起" },
];
const plans = [
  { id: "trial", name: "试吃启动包", price: "¥39", period: "一次性", contains: ["fresh-chicken-starter", "freeze-dried-gut"] },
  { id: "single-cat", name: "单猫鲜食订阅", price: "¥199", period: "每 2 周起", contains: ["fresh-chicken-starter"] },
  { id: "multi-cat", name: "多猫省心计划", price: "¥359", period: "每 2 周起", contains: ["fresh-chicken-starter", "lazy-cat-kit", "litter-toy-kit"] },
  { id: "couple-cat", name: "双猫尝鲜组合", price: "¥129", period: "一次性", contains: ["fresh-chicken-starter", "freeze-dried-gut"] },
];
const policies = [
  { name: "售后与退款政策", doc: "02-refund-policy.md" },
  { name: "配送与冷链说明", doc: "03-shipping.md" },
  { name: "喂食与换粮指南", doc: "04-feeding-guide.md" },
];

// 方案文案 → 产品 id 的关键词映射
function planProducts(plan) {
  const ids = [];
  if (/温煮餐|鲜食/.test(plan)) ids.push("fresh-chicken-starter");
  if (/鸭肉|温补/.test(plan)) ids.push("duck-warm-meal");
  if (/兔肉|低敏/.test(plan)) ids.push("rabbit-lowallergen");
  if (/冻干/.test(plan)) ids.push("freeze-dried-gut");
  if (/梳毛|护理/.test(plan)) ids.push("grooming-kit");
  if (/猫砂|玩具|启蒙/.test(plan)) ids.push("litter-toy-kit");
  if (/用品|套装|懒猫/.test(plan)) ids.push("lazy-cat-kit");
  return [...new Set(ids)];
}

const statements = [];

// 维度节点
for (const [label, values] of [
  ["AgeGroup", [...new Set(matrix.map((r) => r.age))]],
  ["WeightRange", [...new Set(matrix.map((r) => r.weight))]],
  ["FeedingStyle", [...new Set(matrix.map((r) => r.feeding))]],
  ["Issue", [...new Set(matrix.map((r) => r.issue))]],
]) {
  for (const name of values) {
    statements.push({ statement: `MERGE (n:${label} {name: $name})`, parameters: { name } });
  }
}

// Profile 物化 + 推荐链
for (const row of matrix) {
  const key = `${row.age}|${row.weight}|${row.feeding}|${row.issue}`;
  statements.push({
    statement: `
      MERGE (p:Profile {key: $key})
      WITH p
      MATCH (a:AgeGroup {name: $age}), (w:WeightRange {name: $weight}), (f:FeedingStyle {name: $feeding})
      MERGE (a)-[:PROFILE_PART]->(p) MERGE (w)-[:PROFILE_PART]->(p) MERGE (f)-[:PROFILE_PART]->(p)
      WITH p
      MERGE (i:Issue {name: $issue})
      MERGE (p)-[:TYPICAL_ISSUE]->(i)
      MERGE (s:Solution {name: $plan})
      MERGE (i)-[r:RECOMMENDED]->(s) SET r.rate = $rate, r.sample = $sample, r.profileKey = $key`,
    parameters: { key, ...row },
  });
  for (const pid of planProducts(row.plan)) {
    statements.push({
      statement: `MERGE (s:Solution {name: $plan}) MERGE (p:Product {id: $pid}) MERGE (s)-[:INCLUDES]->(p)`,
      parameters: { plan: row.plan, pid },
    });
  }
}

// 产品 / 套餐 / 政策
for (const p of products) {
  statements.push({
    statement: `MERGE (p:Product {id: $id}) SET p.title = $title, p.tag = $tag, p.price = $price`,
    parameters: p,
  });
}
for (const pl of plans) {
  statements.push({
    statement: `MERGE (pl:Plan {id: $id}) SET pl.name = $name, pl.price = $price, pl.period = $period`,
    parameters: pl,
  });
  for (const pid of pl.contains) {
    statements.push({
      statement: `MATCH (pl:Plan {id: $id}), (p:Product {id: $pid}) MERGE (pl)-[:CONTAINS]->(p)`,
      parameters: { id: pl.id, pid },
    });
  }
}
for (const po of policies) {
  statements.push({ statement: `MERGE (po:Policy {name: $name}) SET po.doc = $doc`, parameters: po });
}

// 产品适用问题（人工规则）
for (const [pid, issue] of [
  ["fresh-chicken-starter", "挑食"],
  ["freeze-dried-gut", "肠胃敏感"],
  ["duck-warm-meal", "肠胃敏感"],
  ["rabbit-lowallergen", "肠胃敏感"],
  ["lazy-cat-kit", "多猫省心"],
  ["grooming-kit", "毛发状态"],
  ["litter-toy-kit", "多猫省心"],
]) {
  statements.push({
    statement: `MATCH (p:Product {id: $pid}), (i:Issue {name: $issue}) MERGE (p)-[:SUITABLE_FOR]->(i)`,
    parameters: { pid, issue },
  });
}

// FAQ 入图 + 关联（关键词启发式）
for (const f of faqs) {
  statements.push({ statement: `MERGE (f:FAQ {q: $q}) SET f.a = $a`, parameters: f });
  const about = [];
  if (/挑食|吃吗|适口/.test(f.q)) about.push({ label: "Issue", name: "挑食" });
  if (/软便|换粮|肠胃/.test(f.q)) about.push({ label: "Issue", name: "肠胃敏感" });
  if (/多猫/.test(f.q)) about.push({ label: "Issue", name: "多猫省心" });
  if (/幼猫|老年猫|熟龄/.test(f.q)) about.push({ label: "AgeGroup", name: "熟龄猫 7+" });
  for (const a of about) {
    statements.push({
      statement: `MATCH (f:FAQ {q: $q}), (n:${a.label} {name: $name}) MERGE (f)-[:ABOUT]->(n)`,
      parameters: { q: f.q, name: a.name },
    });
  }
  const policyRefs = [];
  if (/退|包退|售后/.test(f.q)) policyRefs.push("售后与退款政策");
  if (/配送|冷链|送吗|出差|旅游|发货/.test(f.q)) policyRefs.push("配送与冷链说明");
  if (/保存|克数|份量|换粮|软便|喂/.test(f.q)) policyRefs.push("喂食与换粮指南");
  for (const name of policyRefs) {
    statements.push({
      statement: `MATCH (f:FAQ {q: $q}), (po:Policy {name: $name}) MERGE (f)-[:ANSWERED_BY]->(po)`,
      parameters: { q: f.q, name },
    });
  }
}

const CHUNK = 50;
for (let i = 0; i < statements.length; i += CHUNK) {
  await cypher(statements.slice(i, i + CHUNK));
  console.log(`已写入 ${Math.min(i + CHUNK, statements.length)}/${statements.length}`);
}
const counts = await cypher([
  { statement: `MATCH (n) RETURN labels(n)[0] AS label, count(*) AS c ORDER BY label` },
]);
console.log("建库完成:", JSON.stringify(counts.results[0].data.map((d) => `${d.row[0]}:${d.row[1]}`)));
console.log(`矩阵 ${matrix.length} 行，FAQ ${faqs.length} 条`);
