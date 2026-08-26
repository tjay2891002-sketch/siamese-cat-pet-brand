/*
  演示种子数据：给管理端/后台塞入一批样例线索与聊天统计，方便对外演示时有内容可看。
  用法：pnpm seed
  幂等：同一批数据（seedId=demo-2026）已存在时不会重复追加。
*/
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DATA_DIR = path.join(root, "server", "data");
const LEADS_FILE = path.join(DATA_DIR, "leads.jsonl");
const STATS_FILE = path.join(DATA_DIR, "stats.json");
const LEAD_STATUS_FILE = path.join(DATA_DIR, "lead-status.json");
const SEED_ID = "demo-2026";

const readJson = (file, fallback) => {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); } catch { return fallback; }
};

function iso(daysAgo, hour = 10, minute = 20) {
  const d = new Date(Date.now() - daysAgo * 86400000);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const quiz = [
  ["年糕", "6-12月", "2-4kg", "非常挑食", ["改善挑食", "肠胃更稳定"], "微信", "wx-niangao"],
  ["煤球", "1-3岁", "4-6kg", "轻微挑食", ["毛发光泽", "补水防干"], "手机号", "13800000001"],
  ["小橘", "3-7岁", "6kg+", "完全不挑", ["控制体重"], "微信", "wx-xiaoju"],
  ["布丁", "0-6月", "0-2kg", "轻微挑食", ["肠胃更稳定", "改善挑食"], "手机号", "13800000002"],
  ["招财", "1-3岁", "2-4kg", "非常挑食", ["改善挑食"], "微信", "wx-zhaocai"],
  ["锅巴", "3-7岁", "4-6kg", "轻微挑食", ["补水防干"], "手机号", "13800000003"],
  ["雪饼", "7岁+", "6kg+", "完全不挑", ["控制体重", "毛发光泽"], "微信", "wx-xuebing"],
  ["焦糖", "6-12月", "2-4kg", "非常挑食", ["肠胃更稳定", "改善挑食"], "手机号", "13800000004"],
];

const consult = [
  ["豆豆妈", "13800000005", "想先了解试吃包和冷链配送范围。"],
  ["芝麻妈", "13800000006", "猫咪最近软便，想咨询换粮过渡方案。"],
  ["汤圆妈", "wx-tangyuan", "多猫家庭（3只），怎么搭配试吃更划算？"],
  ["芋圆妈", "13800000007", "想了解订阅套餐能否暂停和退款政策。"],
];

const human = [
  ["脖子", "wx-bozi", "猫咪吃吐了要投诉", "用户: 猫咪吃吐了\n小基: 非常抱歉…"],
  ["露露", "13800000008", "订单迟迟没发货", "用户: 下单3天了还没发\n小基: 给您加急处理"],
  ["饭团", "wx-fantuan", "想改收件地址", "用户: 地址填错了想改\n小基: 已为您修改"],
  ["麻薯", "13800000009", "咨询过敏源", "用户: 猫咪对鸡肉过敏怎么办\n小基: 建议换鸭肉餐"],
];

function record(type, data, daysAgo) {
  return { receivedAt: iso(daysAgo), type, seedId: SEED_ID, data };
}

let existing = "";
try { existing = fs.readFileSync(LEADS_FILE, "utf8"); } catch {}
if (existing.includes(SEED_ID)) {
  console.log("[seed] 已存在演示线索（seedId=demo-2026），跳过追加。");
} else {
  const lines = [];
  quiz.forEach((q, i) => lines.push(record("quiz", { catName: q[0], age: q[1], weight: q[2], picky: q[3], goals: q[4], contactType: q[5], contact: q[6], note: "由种子脚本生成", submittedAt: iso(i) }, i)));
  consult.forEach((c, i) => lines.push(record("consult", { name: c[0], contact: c[1], message: c[2], submittedAt: iso(i + 1) }, i + 1)));
  human.forEach((h, i) => lines.push(record("human-request", { catName: h[0], contact: h[1], note: h[2], transcript: h[3] }, i + 2)));
  fs.appendFileSync(LEADS_FILE, lines.map((l) => JSON.stringify(l)).join("\n") + "\n", "utf8");
  console.log("[seed] 已追加演示线索：quiz x" + quiz.length + "，consult x" + consult.length + "，human-request x" + human.length);
}

const stats = readJson(STATS_FILE, { chatTotal: 0, chatByDay: {} });
if (stats.chatTotal === 0) {
  const byDay = {};
  let total = 0;
  for (let d = 0; d < 14; d++) {
    const c = 8 + ((d * 7) % 20);
    byDay[iso(d).slice(0, 10)] = c;
    total += c;
  }
  fs.writeFileSync(STATS_FILE, JSON.stringify({ chatTotal: total, chatByDay: byDay }), "utf8");
  console.log("[seed] 已写入聊天统计：14 天，共 " + total + " 条。");
}

const status = readJson(LEAD_STATUS_FILE, {});
if (Object.keys(status).length === 0) {
  status[iso(0)] = true;
  status[iso(1)] = true;
  fs.writeFileSync(LEAD_STATUS_FILE, JSON.stringify(status), "utf8");
  console.log("[seed] 已写入 2 条已处理工单状态。");
}

console.log("[seed] 完成。");
