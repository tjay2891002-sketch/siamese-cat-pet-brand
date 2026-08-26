import { describe, it, expect } from "vitest";
import { calcTotal, buildCheckoutSummary } from "@/lib/cart";

type Item = { id: string; title: string; price: number; emoji: string; kind: "product" | "plan"; qty: number };

const items: Item[] = [
  { id: "a", title: "试吃启动包", price: 39, emoji: "🍲", kind: "plan", qty: 2 },
  { id: "b", title: "鸭肉温补餐", price: 45, emoji: "🦆", kind: "product", qty: 1 },
];

describe("calcTotal", () => {
  it("按数量正确求和", () => {
    expect(calcTotal(items)).toBeCloseTo(39 * 2 + 45, 2);
  });
  it("空购物车合计为 0", () => {
    expect(calcTotal([])).toBe(0);
  });
});

describe("buildCheckoutSummary", () => {
  it("生成含商品与合计的结算消息", () => {
    const msg = buildCheckoutSummary(items, 123);
    expect(msg).toContain("试吃启动包 ×2");
    expect(msg).toContain("鸭肉温补餐 ×1");
    expect(msg).toContain("¥123.00");
  });
});
