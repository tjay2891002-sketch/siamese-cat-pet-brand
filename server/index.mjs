/*
  基米厨房薄后台（零依赖 Node 服务）
  职责：
  1. POST /api/chat-messages  —— 代理 Dify 对话 API（SSE 透传），Key 只存在于服务端
  2. POST /api/leads          —— 线索落库（测评档案 / 咨询留资），JSONL 追加存储
  3. GET  /api/leads?token=   —— 管理端查看线索（需要 .env 里的 ADMIN_TOKEN）
  运行：pnpm server（或 node server/index.mjs）
*/
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleGraphQuery, graphQuery } from "./graph/query.mjs";
import { handleAdmin, trackChat } from "./admin.mjs";
import { syncLeadToBitable, notifyLeadToGroup } from "./feishu.mjs";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

// 简易 .env 解析（服务运行前需在项目根目录配置）
const env = {};
try {
  for (const line of fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !line.trim().startsWith("#")) env[m[1]] = m[2];
  }
} catch {
  console.warn("[backend] 未找到 .env，使用默认配置");
}

// 环境变量优先于 .env：便于 CI、测试与部署注入密钥/端口/数据目录
for (const key of ["DIFY_API_URL","DIFY_API_KEY","ADMIN_TOKEN","NOTIFY_WEBHOOK_URL","FEISHU_APP_ID","FEISHU_APP_SECRET","FEISHU_BITABLE_APP_TOKEN","FEISHU_BITABLE_TABLE_ID","FEISHU_CHAT_ID","BACKEND_PORT","DATA_DIR"]) {
  if (process.env[key] !== undefined) env[key] = process.env[key];
}

const DIFY_API_URL = (env.DIFY_API_URL || "http://localhost/v1").replace(/\/$/, "");
const DIFY_API_KEY = env.DIFY_API_KEY || "";
const ADMIN_TOKEN = env.ADMIN_TOKEN || "";
const NOTIFY_WEBHOOK_URL = env.NOTIFY_WEBHOOK_URL || ""; // 企业微信/飞书群机器人 webhook
const PORT = Number(env.BACKEND_PORT || 8787);

/** 新工单推送到企业微信/飞书群机器人（按 webhook 域名自动选格式） */
function notifyWebhook(text) {
  if (!NOTIFY_WEBHOOK_URL) return;
  const isWecom = NOTIFY_WEBHOOK_URL.includes("qyapi.weixin.qq.com");
  const body = isWecom
    ? { msgtype: "text", text: { content: text } }
    : { msg_type: "text", content: { text } };
  fetch(NOTIFY_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch((err) => console.warn("[backend] webhook 推送失败:", String(err)));
}

const DATA_DIR = env.DATA_DIR ? path.resolve(env.DATA_DIR) : path.join(root, "server", "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.jsonl");
fs.mkdirSync(DATA_DIR, { recursive: true });

function sendJson(res, status, obj) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (c) => {
      body += c;
      if (body.length > 1_000_000) reject(new Error("body too large"));
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  // 开发期放开跨域（vite 代理下同源，此头仅供直连调试）
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  const url = new URL(req.url ?? "/", "http://localhost");

  // ---- 健康检查（前端据此显示后端连接状态） ----
  if (req.method === "GET" && url.pathname === "/api/health") {
    return sendJson(res, 200, {
      ok: true,
      uptime: Math.round(process.uptime()),
      time: new Date().toISOString(),
      services: {
        dify: DIFY_API_KEY ? "configured" : "missing",
        feishu: env.FEISHU_APP_ID && env.FEISHU_APP_SECRET ? "configured" : "missing",
      },
    });
  }

  // ---- 管理端 ----
  if (handleAdmin(req, res, url, sendJson, ADMIN_TOKEN)) return;

  // ---- Dify 对话代理（SSE 透传 + 图谱事实注入） ----
  if (req.method === "POST" && url.pathname === "/api/chat-messages") {
    if (!DIFY_API_KEY) return sendJson(res, 503, { error: "服务端未配置 DIFY_API_KEY" });
    try {
      const raw = await readBody(req);
      let body = raw;
      let recommendedProductIds = [];
      let isStream = true;
      // 图谱增强：把推荐事实/相关FAQ注入 inputs.graph_facts，失败不影响主流程
      try {
        const payload = JSON.parse(raw);
        isStream = (payload.response_mode ?? "streaming") === "streaming";
        if (payload.query) {
          const inputs = payload.inputs ?? {};
          const g = await graphQuery({
            query: payload.query,
            profile: inputs.cat_age || inputs.cat_weight
              ? { age: inputs.cat_age, weight: inputs.cat_weight, feeding: inputs.cat_feeding }
              : undefined,
          });
          recommendedProductIds = g.products.map((p) => p.id);
          const sections = [];
          if (g.facts.length) sections.push(g.facts.join("\n"));
          if (g.related_faq.length)
            sections.push("相关问答：\n" + g.related_faq.map((f) => `Q:${f.q}\nA:${f.a}`).join("\n"));
          if (g.products.length)
            sections.push("相关产品：" + g.products.map((p) => `${p.title}（${p.id}）`).join("、"));
          payload.inputs = { ...inputs, graph_facts: sections.join("\n\n") };
          body = JSON.stringify(payload);
        }
      } catch (graphErr) {
        console.warn("[backend] 图谱注入失败（忽略）:", String(graphErr));
      }
      const upstream = await fetch(`${DIFY_API_URL}/chat-messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${DIFY_API_KEY}` },
        body,
      });
      trackChat();
      res.writeHead(upstream.status, {
        "Content-Type": upstream.headers.get("content-type") ?? "text/event-stream; charset=utf-8",
      });
      // 流式透传；同时扫描回答文本，模型没按约定输出 [PRODUCT:id] 时在流尾补发一个标记事件，
      // 保证图谱命中产品时前端一定渲染卡片（不依赖模型的标记遵循度）
      let answerSoFar = "";
      const decoder = new TextDecoder();
      if (upstream.body) {
        const reader = upstream.body.getReader();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          res.write(value);
          if (recommendedProductIds.length && !answerSoFar.includes("[PRODUCT:")) {
            for (const m of decoder.decode(value, { stream: true }).matchAll(/"answer"\s*:\s*"((?:[^"\\]|\\.)*)"/g)) {
              answerSoFar += m[1];
            }
          }
        }
      }
      if (isStream && recommendedProductIds.length && !answerSoFar.includes("[PRODUCT:")) {
        const marker = ` [PRODUCT:${recommendedProductIds[0]}]`;
        res.write(`data: ${JSON.stringify({ event: "message", answer: marker })}\n\n`);
      }
      res.end();
    } catch (err) {
      sendJson(res, 502, { error: `上游 Dify 调用失败: ${String(err)}` });
    }
    return;
  }

  // ---- 图谱查询 ----
  if (req.method === "POST" && url.pathname === "/api/graph/query") {
    await handleGraphQuery(req, res, sendJson);
    return;
  }

  // ---- 线索落库 ----
  if (req.method === "POST" && url.pathname === "/api/leads") {
    try {
      const payload = JSON.parse(await readBody(req));
      if (!payload || typeof payload !== "object" || !payload.type) {
        return sendJson(res, 400, { error: "缺少 type 字段" });
      }
      const record = { receivedAt: new Date().toISOString(), ...payload };
      fs.appendFileSync(LEADS_FILE, JSON.stringify(record) + "\n", "utf8");
      console.log(`[backend] 新线索(${payload.type}):`, payload.data?.catName ?? payload.data?.name ?? "");
      void syncLeadToBitable(record, env);
      void notifyLeadToGroup(record, env);
      if (payload.type === "human-request" && !env.FEISHU_CHAT_ID) {
        const d = payload.data ?? {};
        notifyWebhook(
          `【人工客服工单】\n猫咪：${d.catName || "未知"}\n联系方式：${d.contact || "未填"}\n诉求：${d.note || "未填"}\n--- 最近对话 ---\n${d.transcript || "无"}`,
        );
      }
      sendJson(res, 200, { ok: true });
    } catch {
      sendJson(res, 400, { error: "JSON 解析失败" });
    }
    return;
  }

  // ---- 线索查看（管理端） ----
  if (req.method === "GET" && url.pathname === "/api/leads") {
    if (!ADMIN_TOKEN || url.searchParams.get("token") !== ADMIN_TOKEN) {
      return sendJson(res, 401, { error: "未授权" });
    }
    let leads = [];
    try {
      leads = fs
        .readFileSync(LEADS_FILE, "utf8")
        .split("\n")
        .filter(Boolean)
        .map((l) => JSON.parse(l));
    } catch {
      // 文件不存在 = 还没有线索
    }
    sendJson(res, 200, { total: leads.length, leads });
    return;
  }

  sendJson(res, 404, { error: "not found" });
});

server.listen(PORT, () => {
  console.log(`[backend] 薄后台已启动: http://localhost:${PORT}`);
  console.log(`[backend] Dify 上游: ${DIFY_API_URL}（Key ${DIFY_API_KEY ? "已配置" : "未配置！"}）`);
});
