# 图谱 Schema 设计（基米厨房客服）

> 图谱定位：承接「画像 → 问题 → 方案 → 产品」的推理链 + FAQ 关联导航。
> 数据源：`src/data/site.ts` 的 `recommendationMatrix`（现成规则，直接结构化导入）、`products`、`subscriptionPlans`、`faqs`。
> 存储：Neo4j；查询服务对 Dify 暴露 HTTP API。

## 节点

| Label | 关键属性 | 来源 |
|---|---|---|
| `AgeGroup` | name（幼猫 0-1 岁 / 成猫 1-7 岁 / 熟龄猫 7+） | recommendationFilterOptions |
| `WeightRange` | name（≤3kg / 3-4kg / 4-6kg / ≥6kg） | 同上 |
| `FeedingStyle` | name（纯干粮 / 干湿混合 / 主食罐 / 自制鲜食） | 同上 |
| `Profile` | key（age+weight+feeding 组合键） | recommendationMatrix 物化 |
| `Issue` | name（挑食 / 肠胃敏感 / 毛发状态 / 体重管理 / 多猫省心） | recommendationMatrix |
| `Solution` | name、desc（推荐方案文案） | recommendationMatrix.plan |
| `Product` | id、title、tag、price、bullets | products |
| `Plan` | id、name、price、period、features | subscriptionPlans |
| `Policy` | name、doc（政策文档名） | 知识库 02/03 文档 |
| `FAQ` | q、a | 05-FAQ.md |

## 关系

```
(AgeGroup)-[:PROFILE_PART]->(Profile)   -- 可选：组合画像节点
(WeightRange)-[:PROFILE_PART]->(Profile)
(FeedingStyle)-[:PROFILE_PART]->(Profile)
(Profile)-[:TYPICAL_ISSUE]->(Issue)
(Issue)-[:RECOMMENDED {rate, sample}]->(Solution)   -- 带转化率与样本量，来自 recommendationMatrix
(Solution)-[:INCLUDES]->(Product)
(Plan)-[:CONTAINS]->(Product)
(Product)-[:SUITABLE_FOR]->(Issue)
(FAQ)-[:ABOUT]->(Product | Plan | Issue)
(FAQ)-[:ANSWERED_BY]->(Policy)
```

说明：
- `Profile` 组合画像节点**第一期即物化**（决策：图更直观、Neo4j Browser 可视化更好看）。每个 Profile 由 AgeGroup + WeightRange + FeedingStyle 三个维度节点通过 `PROFILE_PART` 挂接，矩阵 15 行就是 15 个 Profile 节点；后续真实用户档案直接挂到对应 Profile 上，自然积累数据。
- `RECOMMENDED` 上的 `rate`/`sample` 保留，客服回答时可以说"类似情况的猫咪里有 94% 适应良好"，这是图谱相比纯向量检索的差异化价值。

## 查询服务 API（供 Dify HTTP 节点调用）

```
POST /graph/query
{ "query": "用户问题原文", "profile": { "age": "...", "weight": "...", "feeding": "..." }? }

→ 200 {
  "facts": [ "成猫 1-7 岁 + 4-6kg + 干湿混合 + 挑食 → 推荐：鸡肉温煮餐 + 冻干小方（94% 适应良好，样本 42）" ],
  "products": [ { "id": "...", "title": "..." } ],
  "related_faq": [ { "q": "...", "a": "..." } ]
}
```

- 有 profile：走画像多跳推理，返回推荐链
- 无 profile：从 query 抽取实体（产品名/问题关键词），返回关联 FAQ 与政策
- 抽取用 DeepSeek function calling，schema 受控于上面的枚举值

## 分期

- **第一期**：矩阵 15 条 + 产品 3 + 套餐 3 + FAQ 全部入图；查询服务一个 `/graph/query` 接口
- **第二期**：真实用户档案与工单挂到已有 `Profile` 节点上，按数据新增 Issue 类型；图谱可视化页面
