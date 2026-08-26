import { describe, it, expect } from "vitest";
import { matchesTrendFilters, findExactMatch, getRecommendation } from "@/lib/recommendation";
import { recommendationMatrix } from "@/data/site";

const empty = { age: [], weight: [], feeding: [] };

describe("matchesTrendFilters", () => {
  it("空筛选匹配所有记录", () => {
    expect(recommendationMatrix.every((r) => matchesTrendFilters(r, empty))).toBe(true);
  });
  it("按年龄筛选只保留该年龄", () => {
    const only = recommendationMatrix.filter((r) =>
      matchesTrendFilters(r, { age: ["成猫 1-7 岁"], weight: [], feeding: [] }),
    );
    expect(only.length).toBeGreaterThan(0);
    expect(only.every((r) => r.age === "成猫 1-7 岁")).toBe(true);
  });
  it("无匹配条件返回空数组", () => {
    const res = recommendationMatrix.filter((r) =>
      matchesTrendFilters(r, { age: ["不存在的年龄"], weight: [], feeding: [] }),
    );
    expect(res).toEqual([]);
  });
});

describe("findExactMatch", () => {
  it("完整画像命中且返回该记录", () => {
    const m = findExactMatch(recommendationMatrix, { age: "成猫 1-7 岁", weight: "3-4kg", feeding: "干湿混合" });
    expect(m).toBeDefined();
    expect(m?.age).toBe("成猫 1-7 岁");
    expect(m?.issue).toBeDefined();
  });
  it("部分字段缺失时忽略缺失维度", () => {
    const m = findExactMatch(recommendationMatrix, { age: "成猫 1-7 岁", weight: "", feeding: "" });
    expect(m).toBeDefined();
    expect(m?.age).toBe("成猫 1-7 岁");
  });
});

describe("getRecommendation", () => {
  it("挑食 + 肠胃敏感推荐鸡肉温煮+冻干小方", () => {
    const r = getRecommendation({ picky: "非常挑食", goals: ["改善挑食", "肠胃更稳定"] });
    expect(r.plan).toContain("¥39");
  });
  it("控重目标推荐控热量订阅", () => {
    const r = getRecommendation({ picky: "偶尔挑食", goals: ["控制体重"] });
    expect(r.plan).toContain("¥199");
  });
  it("默认返回试吃启动包", () => {
    const r = getRecommendation({ picky: "不挑食", goals: ["毛发更顺亮"] });
    expect(r.title).toContain("试吃");
  });
});
