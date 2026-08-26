/*
  模拟订单生成器：为管理后台演示生成 90 天的订单数据。
  数据自洽原则：商品与 site.ts 对齐、金额=商品价×数量、状态随订单年龄自然流转、
  单量呈缓慢增长趋势。可重复运行（每次重新生成）。
  运行：node server/mock/gen-orders.mjs
*/
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(root, "server/data/orders.json");

// 与 site.ts 对齐的商品/套餐（单品价格为演示拟定价）
const SKUS = [
  { id: "trial", title: "试吃启动包", price: 39, weight: 34 },
  { id: "single-cat", title: "单猫鲜食订阅（2 周）", price: 199, weight: 26 },
  { id: "multi-cat", name: "多猫省心计划（2 周）", title: "多猫省心计划（2 周）", price: 359, weight: 14 },
  { id: "fresh-chicken-starter", title: "原切鸡肉温煮餐（单品）", price: 49, weight: 12 },
  { id: "freeze-dried-gut", title: "冻干肠胃小方", price: 29, weight: 10 },
  { id: "lazy-cat-kit", title: "懒猫午睡套装", price: 129, weight: 4 },
];

const SURNAMES = ["奶盖", "布丁", "年糕", "拿铁", "麻薯", "可乐", "雪球", "豆花", "芝麻", "皮蛋", "摩卡", "芝士", "饺子", "咖啡", "泡芙", "奥利奥", "团团", "毛毛", "虎斑", "小七"];
const SUFFIX = ["妈", "爸", "家长", "铲屎官"];
const CITIES = ["上海", "北京", "杭州", "成都", "深圳", "广州", "南京", "武汉", "苏州", "西安", "长沙", "重庆"];
const CHANNELS = ["官网测评", "官网测评", "官网测评", "客服推荐", "复购", "复购"];

// 可复现的伪随机（固定种子，重跑结果一致）
let seed = 42;
const rand = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const pickWeighted = (items) => {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let r = rand() * total;
  for (const i of items) {
    r -= i.weight;
    if (r <= 0) return i;
  }
  return items[0];
};

const now = Date.now();
const DAY = 86400_000;
const orders = [];
let orderSeq = 1000;

for (let daysAgo = 90; daysAgo >= 0; daysAgo--) {
  // 单量：随时间缓慢增长 + 随机波动，周末略高
  const growth = 1 + (90 - daysAgo) / 90; // 90 天前 1 单/天 → 今天 2 单/天
  const date = new Date(now - daysAgo * DAY);
  const weekendBoost = [0, 6].includes(date.getDay()) ? 0.5 : 0;
  const count = Math.round(growth + weekendBoost + rand() * 1.5);

  for (let i = 0; i < count; i++) {
    const created = new Date(now - daysAgo * DAY - rand() * DAY * 0.8);
    const sku = pickWeighted(SKUS);
    const qty = rand() < 0.85 ? 1 : 2;
    const ageDays = (now - created.getTime()) / DAY;

    // 状态随订单年龄自然流转
    let status;
    if (ageDays > 7) status = rand() < 0.94 ? "completed" : "refunded";
    else if (ageDays > 2) status = rand() < 0.8 ? "completed" : "shipped";
    else if (ageDays > 0.5) status = rand() < 0.7 ? "shipped" : "paid";
    else status = rand() < 0.5 ? "paid" : "pending_payment";

    const shipped = ["shipped", "completed"].includes(status);
    orders.push({
      orderNo: `NL${created.getFullYear()}${String(created.getMonth() + 1).padStart(2, "0")}${String(created.getDate()).padStart(2, "0")}${orderSeq++}`,
      skuId: sku.id,
      title: sku.title,
      qty,
      amount: sku.price * qty,
      status, // pending_payment 待付款 / paid 待发货 / shipped 已发货 / completed 已完成 / refunded 已退款
      customer: `${pick(SURNAMES)}${pick(SUFFIX)}`,
      phone: `1${pick(["3", "5", "7", "8", "9"])}${String(Math.floor(rand() * 1e8)).padStart(8, "0")}`,
      city: pick(CITIES),
      channel: pick(CHANNELS),
      createdAt: created.toISOString(),
      shippedAt: shipped ? new Date(created.getTime() + rand() * DAY).toISOString() : null,
      trackingNo: shipped ? `SF${String(Math.floor(rand() * 1e12)).padStart(12, "0")}` : null,
    });
  }
}

orders.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(orders, null, 1), "utf8");

const revenue = orders.filter((o) => o.status !== "refunded" && o.status !== "pending_payment").reduce((s, o) => s + o.amount, 0);
console.log(`生成 ${orders.length} 条订单，总成交额 ¥${revenue}，写入 ${OUT}`);
