/*
  管理端 API：订单查询/发货、看板统计、工单处理状态。
  鉴权：所有接口要求 token 参数匹配 .env 的 ADMIN_TOKEN。
  订单数据来自 server/mock/gen-orders.mjs 生成的 orders.json（模拟数据）。
*/
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "data");
const ORDERS_FILE = path.join(DATA_DIR, "orders.json");
const LEADS_FILE = path.join(DATA_DIR, "leads.jsonl");
const LEAD_STATUS_FILE = path.join(DATA_DIR, "lead-status.json");
const STATS_FILE = path.join(DATA_DIR, "stats.json");

const readJson = (file, fallback) => {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return fallback;
  }
};
const readLeads = () => {
  try {
    return fs.readFileSync(LEADS_FILE, "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l));
  } catch {
    return [];
  }
};

/** 聊天统计打点（由 index.mjs 在代理对话时调用） */
export function trackChat() {
  const stats = readJson(STATS_FILE, { chatTotal: 0, chatByDay: {} });
  const day = new Date().toISOString().slice(0, 10);
  stats.chatTotal += 1;
  stats.chatByDay[day] = (stats.chatByDay[day] ?? 0) + 1;
  fs.writeFileSync(STATS_FILE, JSON.stringify(stats), "utf8");
}

function overview() {
  const orders = readJson(ORDERS_FILE, []);
  const leads = readLeads();
  const leadStatus = readJson(LEAD_STATUS_FILE, {});
  const stats = readJson(STATS_FILE, { chatTotal: 0, chatByDay: {} });

  const valid = orders.filter((o) => o.status !== "refunded" && o.status !== "pending_payment");
  const today = new Date().toISOString().slice(0, 10);

  // 近 30 天按天聚合
  const byDayMap = {};
  for (const o of valid) {
    const day = o.createdAt.slice(0, 10);
    byDayMap[day] = byDayMap[day] || { date: day, revenue: 0, orders: 0 };
    byDayMap[day].revenue += o.amount;
    byDayMap[day].orders += 1;
  }
  const byDay = Object.values(byDayMap).sort((a, b) => a.date.localeCompare(b.date)).slice(-30);

  const byStatus = {};
  for (const o of orders) byStatus[o.status] = (byStatus[o.status] ?? 0) + 1;

  const bySku = {};
  for (const o of valid) {
    bySku[o.title] = bySku[o.title] || { title: o.title, count: 0, revenue: 0 };
    bySku[o.title].count += o.qty;
    bySku[o.title].revenue += o.amount;
  }

  return {
    totalRevenue: valid.reduce((s, o) => s + o.amount, 0),
    todayRevenue: valid.filter((o) => o.createdAt.startsWith(today)).reduce((s, o) => s + o.amount, 0),
    totalOrders: orders.length,
    pendingShipment: orders.filter((o) => o.status === "paid").length,
    byDay,
    byStatus: Object.entries(byStatus).map(([status, count]) => ({ status, count })),
    topSkus: Object.values(bySku).sort((a, b) => b.revenue - a.revenue),
    leads: {
      total: leads.length,
      openTickets: leads.filter((l) => l.type === "human-request" && !leadStatus[l.receivedAt]).length,
      byType: leads.reduce((acc, l) => ({ ...acc, [l.type]: (acc[l.type] ?? 0) + 1 }), {}),
    },
    chat: stats,
  };
}

/** 返回 true 表示已处理该请求 */
export function handleAdmin(req, res, url, sendJson, adminToken) {
  if (!url.pathname.startsWith("/api/admin/")) return false;
  const token = url.searchParams.get("token");
  const authed = adminToken && token === adminToken;

  // 读接口
  if (req.method === "GET" && url.pathname === "/api/admin/overview") {
    if (!authed) return sendJson(res, 401, { error: "未授权" }), true;
    return sendJson(res, 200, overview()), true;
  }
  if (req.method === "GET" && url.pathname === "/api/admin/orders") {
    if (!authed) return sendJson(res, 401, { error: "未授权" }), true;
    const status = url.searchParams.get("status") || "";
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const size = 20;
    let orders = readJson(ORDERS_FILE, []).slice().reverse(); // 最新在前
    if (status) orders = orders.filter((o) => o.status === status);
    return sendJson(res, 200, { total: orders.length, page, orders: orders.slice((page - 1) * size, page * size) }), true;
  }
  if (req.method === "GET" && url.pathname === "/api/admin/leads") {
    if (!authed) return sendJson(res, 401, { error: "未授权" }), true;
    const leadStatus = readJson(LEAD_STATUS_FILE, {});
    const leads = readLeads()
      .map((l) => ({ ...l, resolved: Boolean(leadStatus[l.receivedAt]) }))
      .reverse();
    return sendJson(res, 200, { total: leads.length, leads }), true;
  }

  // 写接口（token 放 body）
  if (req.method === "POST") {
    let body = "";
    req.on("data", (c) => (body += c));
    req.on("end", () => {
      let payload = {};
      try {
        payload = JSON.parse(body || "{}");
      } catch {}
      if (!adminToken || payload.token !== adminToken) return sendJson(res, 401, { error: "未授权" });

      if (url.pathname === "/api/admin/orders/ship") {
        const orders = readJson(ORDERS_FILE, []);
        const order = orders.find((o) => o.orderNo === payload.orderNo);
        if (!order) return sendJson(res, 404, { error: "订单不存在" });
        if (order.status !== "paid") return sendJson(res, 400, { error: `当前状态(${order.status})不可发货` });
        order.status = "shipped";
        order.shippedAt = new Date().toISOString();
        order.trackingNo = payload.trackingNo || `SF${Date.now()}`;
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 1), "utf8");
        return sendJson(res, 200, { ok: true, order });
      }
      if (url.pathname === "/api/admin/leads/resolve") {
        const leadStatus = readJson(LEAD_STATUS_FILE, {});
        leadStatus[payload.receivedAt] = true;
        fs.writeFileSync(LEAD_STATUS_FILE, JSON.stringify(leadStatus), "utf8");
        return sendJson(res, 200, { ok: true });
      }
      sendJson(res, 404, { error: "not found" });
    });
    return true;
  }

  sendJson(res, 404, { error: "not found" });
  return true;
}
