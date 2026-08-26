/*
  购物车纯逻辑：便于单测与复用。
*/
export type CartLine = { id: string; title: string; price: number; emoji: string; kind: "product" | "plan"; qty: number };

/** 计算购物车合计金额 */
export function calcTotal(items: { price: number; qty: number }[]): number {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0);
}

/** 生成结算留资消息 */
export function buildCheckoutSummary(items: CartLine[], total: number): string {
  const summary = items.map((i) => `${i.title} ×${i.qty}`).join("、");
  return `购物车结算：${summary}，合计 ¥${total.toFixed(2)}`;
}
