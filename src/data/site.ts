/*
  设计路线：暗调私厨 × 宠物健康 DTC。
  数据层目标：把可上线 MVP 的商品、套餐、FAQ、评价与测评选项集中管理，便于后续接 CMS 或表格。
*/
import catSniffing from "@/assets/cats/cat-sniffing.webp";
import catGrooming from "@/assets/cats/cat-grooming.webp";
import catNapping from "@/assets/cats/cat-napping.webp";

export const brand = {
  name: "九命鲜厨",
  englishName: "NINE LIVES KITCHEN",
  slogan: "给挑食主子，做一份会被认真闻过的鲜食。",
  contactEmail: "hello@ninelives.example",
  serviceArea: "全国主要城市冷链试运营",
};

export const navItems = [
  { href: "/nutrition", label: "配方" },
  { href: "/quiz", label: "测评" },
  { href: "/plans", label: "套餐" },
  { href: "/shop", label: "用品" },
  { href: "/kitchen", label: "透明厨房" },
  { href: "/reviews", label: "口碑" },
];

export const proofItems = [
  "兽医营养顾问共创食谱",
  "0 谷物 · 0 胶质 · 0 诱食剂",
  "猫咪不爱吃，全额包退",
  "冷链鲜配，周期可暂停",
];

export const stats = [
  { value: "90%", label: "试吃反馈毛发更顺亮", note: "MVP 阶段可替换为真实复购调研" },
  { value: "85%", label: "反馈猫砂盆气味更轻", note: "基于换粮适应期后观察" },
  { value: "3步", label: "从猫咪档案到专属试吃装", note: "先收集线索，再承接客服转化" },
];

export const comparisons = [
  { bad: "高温膨化，肉源不透明", good: "原切肉低温温煮，批次可追溯" },
  { bad: "大量填充碳水，猫咪容易胖", good: "高动物蛋白，按体重控制热量" },
  { bad: "诱食剂香，吃完却不安心", good: "0 诱食剂，用真实肉香打开食欲" },
];

export const products = [
  {
    id: "fresh-chicken-starter",
    img: catSniffing,
    tag: "鲜食主餐",
    title: "原切鸡肉温煮餐",
    desc: "高蛋白、低碳水，给挑食猫也愿意闻一闻的第一口。",
    price: "新人试吃 ¥39 起",
    bullets: ["单猫 3 日试吃", "适合挑食与换粮", "冷冻锁鲜配送"],
  },
  {
    id: "freeze-dried-gut",
    img: catGrooming,
    tag: "功能零食",
    title: "冻干肠胃小方",
    desc: "随餐加一点，帮助从传统干粮更温和地过渡。",
    price: "测评后推荐",
    bullets: ["少量多次过渡", "搭配鲜食使用", "适合肠胃敏感猫"],
  },
  {
    id: "lazy-cat-kit",
    img: catNapping,
    tag: "生活用品",
    title: "懒猫午睡套装",
    desc: "猫窝、梳毛、互动玩具一起配齐，补货不用到处找。",
    price: "组合省心购",
    bullets: ["猫窝 + 梳毛", "适合新手家庭", "随餐凑单配送"],
  },
];

export const subscriptionPlans = [
  {
    id: "trial",
    name: "试吃启动包",
    price: "¥39",
    period: "一次性",
    highlight: "最适合首次转化",
    desc: "先让猫咪投票，不满意可申请退款。",
    features: ["3 日鲜食试吃", "1 包冻干小样", "测评报告截图", "客服换粮建议"],
  },
  {
    id: "single-cat",
    name: "单猫鲜食订阅",
    price: "¥199",
    period: "每 2 周起",
    highlight: "灵活暂停",
    desc: "适合稳定吃鲜食的单猫家庭。",
    features: ["按体重估算份量", "2 种蛋白轮换", "冷链周期配送", "可随时暂停"],
  },
  {
    id: "multi-cat",
    name: "多猫省心计划",
    price: "¥359",
    period: "每 2 周起",
    highlight: "多猫家庭推荐",
    desc: "为不同猫咪建立档案，合并配送更省心。",
    features: ["最多 3 只猫档案", "口味组合发货", "用品凑单折扣", "专属客服提醒"],
  },
];

export const steps = [
  {
    title: "1. 建立猫咪档案",
    desc: "填写年龄、体重、挑食程度、肠胃状态，先理解主子的脾气。",
  },
  {
    title: "2. 生成鲜食方案",
    desc: "推荐蛋白来源、热量区间与试吃组合，不让你在配料表里迷路。",
  },
  {
    title: "3. 冷链送到门口",
    desc: "试吃合适后再订阅，周期、口味、数量都可以灵活调整。",
  },
];

export const reviews = [
  {
    name: "奶盖妈 · 新手养猫",
    text: "以前看到配料表就头大，测评后直接给了试吃方案。猫咪先闻了半天，第二天就开始主动等饭。",
  },
  {
    name: "阿布爸 · 成分党",
    text: "我最喜欢的是透明厨房模块，肉源、工艺、冷冻配送都说清楚了，不是只会喊天然。",
  },
  {
    name: "三猫家庭 · 囤货党",
    text: "多猫档案很实用，不同口味可以一起发，省掉我每个月翻购物车的时间。",
  },
];

export const recommendationFilterOptions = {
  age: ["幼猫 0-1 岁", "成猫 1-7 岁", "熟龄猫 7+"],
  weight: ["≤3kg", "3-4kg", "4-6kg", "≥6kg"],
  feeding: ["纯干粮", "干湿混合", "主食罐", "自制/鲜食"],
};

export const recommendationMatrix = [
  { age: "幼猫 0-1 岁", weight: "≤3kg", feeding: "纯干粮", issue: "挑食", rate: 72, sample: 14, plan: "幼猫温和试吃 + 少量多餐" },
  { age: "幼猫 0-1 岁", weight: "≤3kg", feeding: "干湿混合", issue: "肠胃敏感", rate: 80, sample: 18, plan: "低脂试吃 + 7 天换粮" },
  { age: "幼猫 0-1 岁", weight: "3-4kg", feeding: "主食罐", issue: "毛发状态", rate: 83, sample: 12, plan: "鸡肉温煮餐 + 梳毛用品" },
  { age: "成猫 1-7 岁", weight: "3-4kg", feeding: "纯干粮", issue: "挑食", rate: 81, sample: 28, plan: "冻干引导 + 渐进换粮" },
  { age: "成猫 1-7 岁", weight: "3-4kg", feeding: "干湿混合", issue: "肠胃敏感", rate: 89, sample: 36, plan: "鸡肉温煮餐 + 冻干肠胃小方" },
  { age: "成猫 1-7 岁", weight: "4-6kg", feeding: "干湿混合", issue: "挑食", rate: 94, sample: 42, plan: "鸡肉温煮餐 + 冻干小方" },
  { age: "成猫 1-7 岁", weight: "4-6kg", feeding: "主食罐", issue: "毛发状态", rate: 88, sample: 31, plan: "高动物蛋白鲜食订阅" },
  { age: "成猫 1-7 岁", weight: "4-6kg", feeding: "自制/鲜食", issue: "多猫省心", rate: 91, sample: 22, plan: "订阅补货 + 用品组合" },
  { age: "成猫 1-7 岁", weight: "≥6kg", feeding: "纯干粮", issue: "体重管理", rate: 75, sample: 26, plan: "控热量计划 + 份量解释" },
  { age: "成猫 1-7 岁", weight: "≥6kg", feeding: "干湿混合", issue: "体重管理", rate: 84, sample: 33, plan: "控热量鲜食订阅" },
  { age: "熟龄猫 7+", weight: "3-4kg", feeding: "主食罐", issue: "肠胃敏感", rate: 82, sample: 20, plan: "低脂鲜食 + 慢速换粮" },
  { age: "熟龄猫 7+", weight: "4-6kg", feeding: "干湿混合", issue: "肠胃敏感", rate: 86, sample: 24, plan: "温和蛋白 + 观察便便" },
  { age: "熟龄猫 7+", weight: "4-6kg", feeding: "自制/鲜食", issue: "毛发状态", rate: 84, sample: 17, plan: "鲜食订阅 + 护理用品" },
  { age: "熟龄猫 7+", weight: "≥6kg", feeding: "纯干粮", issue: "体重管理", rate: 70, sample: 15, plan: "控热量试吃 + 兽医建议" },
  { age: "熟龄猫 7+", weight: "≥6kg", feeding: "主食罐", issue: "多猫省心", rate: 78, sample: 13, plan: "多猫省心计划" },
];

export const faqs = [
  {
    q: "我的猫很挑食，真的适合吗？",
    a: "适合先从小份试吃开始。页面核心承诺是“猫咪不爱吃，全额包退”，正式上线可接入售后流程与试吃反馈记录。",
  },
  {
    q: "鲜食需要每天自己计算克数吗？",
    a: "不需要。测评会根据体重、年龄、活动量和目标状态推荐每日份量，订阅后按周期配送。",
  },
  {
    q: "除了主食，还能买什么？",
    a: "官网设计了综合商城入口，可承接冻干、猫条、梳毛用品、猫窝和订阅补货，实现一站式养猫。",
  },
  {
    q: "现在没有后台，线索怎么收？",
    a: "MVP 阶段先把表单结果保存到浏览器并预留第三方表单接口；上线时可接飞书多维表格、Formspree、金数据或企业微信客服。",
  },
];

export const quizOptions = {
  ages: ["幼猫 0-1 岁", "成猫 1-7 岁", "熟龄猫 7 岁以上"],
  picky: ["不挑食", "偶尔挑食", "非常挑食"],
  goals: ["改善挑食", "肠胃更稳定", "控制体重", "毛发更顺亮", "一站式省心补货"],
  contacts: ["微信", "手机号", "邮箱"],
};

export type QuizLead = {
  catName: string;
  age: string;
  weight: string;
  picky: string;
  goals: string[];
  contactType: string;
  contact: string;
  note?: string;
  submittedAt: string;
};
