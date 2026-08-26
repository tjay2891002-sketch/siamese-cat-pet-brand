/*
  推荐匹配核心纯逻辑：抽取成独立模块，便于单测。
*/
import type { QuizLead } from "@/data/site";

export type TrendFilters = Record<"age" | "weight" | "feeding", string[]>;

export type MatrixRecord = {
  age: string;
  weight: string;
  feeding: string;
  issue: string;
  rate: number;
  sample: number;
  plan: string;
};

/** 按筛选条件匹配某条推荐记录；filters 为空数组表示该维度不限制 */
export function matchesTrendFilters(
  record: MatrixRecord,
  filters: TrendFilters,
  overrides?: Partial<TrendFilters>,
): boolean {
  const current = { ...filters, ...overrides };
  return (["age", "weight", "feeding"] as const).every(
    (key) => current[key].length === 0 || current[key].includes(record[key]),
  );
}

/** 按最接近的画像找到推荐记录；任一字段未填则忽略该维度 */
export function findExactMatch(
  matrix: MatrixRecord[],
  form: Partial<Record<"age" | "weight" | "feeding", string>>,
): MatrixRecord | undefined {
  return matrix.find(
    (record) =>
      (!form.age || record.age === form.age) &&
      (!form.weight || record.weight === form.weight) &&
      (!form.feeding || record.feeding === form.feeding),
  );
}

export type Recommendation = { title: string; desc: string; plan: string };

/** 测评问答 → 鲜食方案（规则推荐） */
export function getRecommendation(lead: Pick<QuizLead, "picky" | "goals">): Recommendation {
  const isPicky = lead.picky.includes("非常") || lead.goals.includes("改善挑食");
  const gut = lead.goals.includes("肠胃更稳定");
  const weight = lead.goals.includes("控制体重");

  if (isPicky && gut) {
    return {
      title: "鸡肉温煮餐 + 冻干肠胃小方",
      desc: "先用气味温和的鸡肉鲜食打开食欲，再用冻干小方帮助换粮过渡。建议从 25% 鲜食比例开始。",
      plan: "试吃启动包 ¥39",
    };
  }
  if (weight) {
    return {
      title: "控热量鲜食订阅计划",
      desc: "按体重估算每日热量，先从单猫 3 日试吃开始，观察饱腹感与便便状态后再订阅。",
      plan: "单猫鲜食订阅 ¥199 / 2 周起",
    };
  }
  return {
    title: "原切鸡肉温煮餐试吃包",
    desc: "适合作为鲜食入门方案，先验证猫咪接受度，再决定是否加入周期配送。",
    plan: "试吃启动包 ¥39",
  };
}
