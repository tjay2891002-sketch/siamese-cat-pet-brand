import { describe, it, expect } from "vitest";
import { recommendationMatrix, recommendationFilterOptions, products, subscriptionPlans } from "@/data/site";

describe("推荐矩阵数据完整性", () => {
  it("所有出现过的维度取值都在筛选选项内", () => {
    for (const r of recommendationMatrix) {
      expect(recommendationFilterOptions.age).toContain(r.age);
      expect(recommendationFilterOptions.weight).toContain(r.weight);
      expect(recommendationFilterOptions.feeding).toContain(r.feeding);
    }
  });
  it("命中率在 0-100、样本量大于 0、方案非空", () => {
    for (const r of recommendationMatrix) {
      expect(r.rate).toBeGreaterThanOrEqual(0);
      expect(r.rate).toBeLessThanOrEqual(100);
      expect(r.sample).toBeGreaterThan(0);
      expect(r.plan.length).toBeGreaterThan(0);
    }
  });
});

describe("商品数据完整性", () => {
  it("商品 id 全局唯一", () => {
    const ids = products.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("商品价格为正数", () => {
    for (const p of products) {
      expect(p.priceValue).toBeGreaterThan(0);
    }
  });
});

describe("订阅套餐数据完整性", () => {
  it("套餐 id 全局唯一", () => {
    const ids = subscriptionPlans.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("套餐价格为正数且特性非空", () => {
    for (const s of subscriptionPlans) {
      expect(s.priceValue).toBeGreaterThan(0);
      expect(s.features.length).toBeGreaterThan(0);
    }
  });
});
