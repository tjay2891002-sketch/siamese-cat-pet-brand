/*
  飞书多维表格线索同步（可选）。
  配置 .env：
    FEISHU_APP_ID / FEISHU_APP_SECRET   飞书自建应用
    FEISHU_BITABLE_APP_TOKEN / FEISHU_BITABLE_TABLE_ID   多维表格
  未配置时静默跳过，不影响主对话流程。
*/
const BASE = "https://open.feishu.cn/open-apis";

/** 获取飞书 tenant_access_token（自建应用） */
async function tenantToken(appId, appSecret) {
  const res = await fetch(`${BASE}/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app_id: appId, app_secret: appSecret }),
  });
  const json = await res.json();
  if (json.code !== 0 || !json.tenant_access_token) {
    throw new Error(`飞书 token 获取失败: ${json.msg || json.code}`);
  }
  return json.tenant_access_token;
}

/** 把线索记录映射为多维表格字段（字段名需与你在飞书建的一致） */
export function toBitableFields(payload) {
  const d = payload.data ?? {};
  const goals = Array.isArray(d.goals) ? d.goals.join("、") : d.goals || "";
  return {
    时间: payload.receivedAt,
    类型: payload.type,
    猫名: d.catName || d.name || "",
    年龄: d.age || "",
    体重: d.weight || "",
    挑食: d.picky || "",
    目标: goals,
    联系方式: d.contact || "",
    诉求: d.note || d.message || "",
    对话: d.transcript || "",
  };
}

/** 同步线索到飞书多维表格；未配置/失败时静默降级 */
export async function syncLeadToBitable(payload, env) {
  const appId = env.FEISHU_APP_ID || "";
  const appSecret = env.FEISHU_APP_SECRET || "";
  const appToken = env.FEISHU_BITABLE_APP_TOKEN || "";
  const tableId = env.FEISHU_BITABLE_TABLE_ID || "";
  if (!appId || !appSecret || !appToken || !tableId) return;

  try {
    const token = await tenantToken(appId, appSecret);
    const res = await fetch(`${BASE}/bitable/v1/apps/${appToken}/tables/${tableId}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ fields: toBitableFields(payload) }),
    });
    const json = await res.json();
    if (json.code !== 0) {
      console.warn("[backend] 飞书多维表格写入失败:", json.msg || json.code);
    } else {
      console.log("[backend] 已同步线索到飞书多维表格");
    }
  } catch (err) {
    console.warn("[backend] 飞书多维表格同步异常:", String(err));
  }
}

/** 把线索记录格式化为群通知文本 */
export function toLeadText(payload) {
  const d = payload.data ?? {};
  const goals = Array.isArray(d.goals) ? d.goals.join("、") : d.goals || "";
  const lines = [
    `🐱 新线索 · ${payload.type || "咨询"}`,
    `时间：${payload.receivedAt || "-"}`,
    `猫咪：${d.catName || d.name || "未知"}`,
    `年龄：${d.age || "-"}`,
    `体重：${d.weight || "-"}`,
    `挑食：${d.picky || "-"}`,
    `目标：${goals || "-"}`,
    `联系方式：${d.contact || "-"}`,
    `诉求：${d.note || d.message || "-"}`,
  ];
  if (d.transcript) lines.push(`对话：${d.transcript}`);
  return lines.join("\n");
}

/** 推送线索到飞书群（应用机器人身份）；未配置/失败时静默降级 */
export async function notifyLeadToGroup(payload, env) {
  const appId = env.FEISHU_APP_ID || "";
  const appSecret = env.FEISHU_APP_SECRET || "";
  const chatId = env.FEISHU_CHAT_ID || "";
  if (!appId || !appSecret || !chatId) return;
  try {
    const token = await tenantToken(appId, appSecret);
    const text = toLeadText(payload);
    const res = await fetch(`${BASE}/im/v1/messages?receive_id_type=chat_id`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ receive_id: chatId, msg_type: "text", content: JSON.stringify({ text }) }),
    });
    const json = await res.json();
    if (json.code !== 0) console.warn("[backend] 飞书群通知失败:", json.msg || json.code);
    else console.log("[backend] 已推送线索到飞书群");
  } catch (err) {
    console.warn("[backend] 飞书群通知异常:", String(err));
  }
}