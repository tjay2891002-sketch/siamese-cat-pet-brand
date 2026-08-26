/*
  线索上报：测评档案 / 咨询留资在写 localStorage 的同时上报薄后台。
  失败静默降级（不影响前端流程，本地仍有一份）。
*/

export type LeadType = "quiz" | "consult" | "human-request";

export function reportLead(type: LeadType, data: unknown): void {
  fetch("/api/leads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, data }),
  }).catch(() => {
    // 后台未启动时静默失败，线索仍保留在浏览器 localStorage
  });
}
