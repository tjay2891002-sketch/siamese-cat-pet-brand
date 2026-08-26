# 基米厨房 · 项目复盘

> 定位：面向「宠物鲜食」DTC 的品牌全栈项目，围绕「先测评 → 再试吃 → 再订阅」的高转化漏斗展开。
> 本文用于复盘整个开发过程：**做了什么、用了什么架构、踩了哪些坑、后续怎么持续优化**。可结合 `README.md`（对外呈现）与 `docs/DEVELOPMENT_NOTES.md`（迭代记录）一起看。

## 0. 一句话总结

用 React 全栈 + Dify 知识库 RAG + Neo4j 知识图谱，做了一个「品牌官网 + AI 客服 + 运营后台 + 线索自动化」的可演示 MVP；已补齐工程化（一键启动 / 健康检查 / 单测 / 集成测试 / 压测 / README / 截图瘦身），并托管到 GitHub 私有仓库新分支，暂用临时隧道对外演示。

---

## 1. 我做了什么（按阶段拆解）

### 1.1 阶段一：从品牌官网到全栈 MVP
- **品牌重塑**：「九命鲜厨 / NINE LIVES KITCHEN」→「基米厨房 / KIMI KITCHEN」，暗调私厨风格（深森林绿 / 奶油白 / 焦糖橙、杂志式错位排版、3D 粒子背景）。
- **页面**：首屏 Hero、营养主张、猫咪健康测评漏斗、推荐方案、套餐、商品/用品、透明厨房、口碑评价、FAQ、页脚 CTA。
- **测评漏斗**：收集猫咪画像（名字 / 年龄 / 体重 / 挑食 / 健康目标 / 联系方式）→ 生成推荐方案 → 一键生成试吃清单。
- **用品 + 套餐**：主食 / 零食 / 用品手风琴展开，订阅套餐折叠浏览；购物车支持加购与结算留资。
- **AI 客服**：悬浮可拖拽按钮、SSE 流式回复、产品卡片、猫咪档案联动、转人工留资。
- **薄后台**：API 代理（密钥隔离）、图谱事实注入、线索工单、管理端 API、webhook 通知。
- **运营后台** `/#/admin`：看板、订单、工单状态管理，需 `ADMIN_TOKEN`。

### 1.2 阶段二：前端体验与交互迭代（大量来自真实使用反馈）
- 滚动条改细、贴合主题色。
- 主食 / 套餐旁的「+ / −」展开收拢分类抽屉；用品 / 套餐抽屉化。
- 修复「打开购物车或套餐后主页面向右偏移」。
- 修复「页面切换滚动串页」：测评 / 用品各自独立滚动位置，首次进入回到顶部，切回时恢复各自位置，互不混合。
- 导航当前页高亮：与「鼠标悬停」一致的克制样式（浅底色 + 主题橙字）；首页品牌字带淡淡白色微光。
- 修复「测评 / 用品页左上角被固定导航遮挡」，顶部留白加大。
- 页面分区调整：配方与透明厨房合并，常见疑虑放页面最后。

### 1.3 阶段三：AI 客服 + 知识图谱
- 串联 **Dify（自托管）知识库 RAG**：混合检索 + Rerank。
- 用 **Neo4j** 建知识图谱：画像 → 问题 → 方案 → 产品推理链，把组合画像节点物化。
- 图谱事实注入 + FAQ 关联导航；客服回答带「推荐命中率 / 样本量」。
- 意图抽取用 DeepSeek function calling，schema 受控于枚举值。

### 1.4 阶段四：后端 / 数据 / 飞书自动化
- 零依赖 Node 薄后台（原生 `http`）：`/api/chat-messages`、`/api/leads`、`/api/graph/query`、`/api/health`、管理端 API。
- 线索落库 `leads.jsonl`；模拟订单 `orders.json`；图谱建库 / 查询脚本。
- 飞书：群机器人 webhook（转人工提醒）、飞书多维表格线索沉淀、自建应用 + 群 `chat_id`。

### 1.5 阶段五：工程化
- **P0 稳定跑通**：`pnpm dev:all` 一键同时启动前后端、后端 `/api/health` 健康检查、仅在本地/局域网显示连接状态、`pnpm seed` 幂等种子数据。
- **P1 自动化**：抽纯逻辑模块（推荐 / 购物车）提可测性；Vitest 单测 + 后端集成测试（4 文件 / 21 用例）；零依赖压测脚本。
- **README 升级** + 截图瘦身（PNG → WebP，约 3.3MB → 318KB）。
- **命名统一**：站点 / 后台 / 知识库 / README 全部「基米厨房」；客服助手名最终定为「基米厨房 老吴」，并重新截图。

### 1.6 阶段六：安全与版本管理
- `.env`、`server/data/` 进 `.gitignore`；密钥只留服务端；前端 `VITE_` 前缀变量可进浏览器。
- 推送 GitHub **私有仓库**、新建分支 `codex/demo-ready`；提交前做密钥扫描，确认不提交 `.env` / `leads.jsonl`。
- 对外演示采用 **方案 C**：临时公网隧道（cloudflared / ngrok），仅面试展示用，不做正式上线。

---

## 2. 技术架构

### 2.1 前端
- **React 19 + Vite + TypeScript + Tailwind CSS 4 + shadcn-ui（Radix primitives）**。
- 路由：`wouter` + hash 路由（`useHashLocation`）；`/:section?` 用单页承载多 section，`/admin` 独立后台。
- 动效 / 图表：`three`（3D 粒子）、`framer-motion`、`recharts`（后台图表）、`embla-carousel`、`streamdown`。
- 状态：React hooks + `localStorage`（猫咪档案 / 购物车 / 聊天位置）。
- 数据源：`src/data/site.ts` 作为品牌单一事实源（商品 / 套餐 / 推荐矩阵 / FAQ / 导航）。

### 2.2 后端（薄后台）
- 零依赖 Node 原生 `http`：`server/index.mjs` + `admin.mjs` + `feishu.mjs` + `graph/*`。
- 职责：Dify 代理（SSE 透传、密钥隔离）、线索落库、图谱事实注入、管理端 API、飞书同步、webhook、健康检查。

### 2.3 AI / 知识库
- Dify（Docker 自托管），Chatflow API，SSE 流式。未配置时开发环境回退假数据，生产环境隐藏组件。
- 知识库 RAG：Markdown 文档（产品套餐 / 售后 / 配送 / 喂食换粮 / FAQ / 养猫通用 / 用品家居）。
- DeepSeek 负责意图抽取与问题实体识别（function calling），schema 受控枚举。

### 2.4 知识图谱
- Neo4j 5（Docker），通过 HTTP Cypher（`/db/neo4j/tx/commit`）读写。
- 节点：`AgeGroup / WeightRange / FeedingStyle / Profile / Issue / Solution / Product / Plan / Policy / FAQ`。
- 关系：`PROFILE_PART / TYPICAL_ISSUE / RECOMMENDED(rate, sample) / INCLUDES / CONTAINS / SUITABLE_FOR / ABOUT / ANSWERED_BY`。
- `Profile` 组合画像物化（推荐矩阵 15 行 → 15 个 Profile 节点），图更直观、后续可扩展真实用户档案。

### 2.5 数据与集成
- `server/data/leads.jsonl` 线索、`orders.json` 模拟订单；`DATA_DIR` 可重定向（测试隔离 / 部署注入）。
- 飞书群机器人 webhook + 飞书多维表格（`app_token` / `table_id`）。
- 前端在 dev 通过 Vite 代理 `/api` → 薄后台 `:8787`；生产用 `VITE_DIFY_API_URL` 指向后端。

### 2.6 架构图（文本）

```text
浏览器
  ├─ 官网（React，hash 路由）
  │   测评 / 用品 / 套餐 / 透明厨房 / FAQ / 购物车
  └─ 聊天组件 ──→ /api（vite 代理）──→ 薄后台 :8787
                                        ├─ 图谱事实注入 ← Neo4j :7474
                                        ├─ 转发对话 ──→ Dify :80（知识库 RAG + 档案变量 + DeepSeek 抽取）
                                        ├─ 线索工单 → leads.jsonl → 飞书群 / 飞书多维表格
                                        └─ 管理端 API ← /#/admin 运营后台
```

### 2.7 一次问答的完整链路

1. 前端读 `localStorage` 测评档案（猫名 / 年龄 / 体重 / 挑食），作为会话变量随问题发出。
2. 薄后台查 Neo4j：档案命中组合画像节点 → 推理出典型问题与推荐方案（含历史适应率 / 样本量）。
3. 推荐事实 + 相关 FAQ 注入 `graph_facts`，连同问题转发 Dify。
4. Dify 做知识库检索（混合检索 + Rerank），生成回答。
5. 回答里的 `[PRODUCT:id]` / `[HUMAN]` 标记由前端渲染为产品卡片 / 人工留资卡（后端有标记兜底，不依赖模型自觉）。

---

## 3. 难题与解法（踩坑复盘）

### 3.1 品牌 / 命名反复，全局同步成本高
- **现象**：从「九命鲜厨」到「基米厨房」；客服助手名先后「小九 → 基米小厨 → 老吴 → 基米厨房 老吴」。
- **坑**：名字散落在站点配置、首页、管理端、线索组件、后端、知识库、README、截图里，容易漏改。
- **解法**：品牌集中到 `site.ts` 的 `brand` 单一事实源；用脚本全量扫描替换；每改一次就重截截图并跑校验。

### 3.2 前端交互「串状态」
- **现象**：打开购物车 / 套餐后主页面向右偏移；测评 / 用品切换后滚动位置互相传染；左上角被固定导航遮挡。
- **解法**：抽屉 / 弹层改成叠加层而非让布局回流；每个 section 独立滚动记忆；顶部留白加大。

### 3.3 导航高亮「浮夸 vs 克制」
- **现象**：需求从「发光」收敛到「克制」，最终与鼠标悬停一致的浅底 + 主题橙字，首页品牌字带淡淡白微光。
- **解法**：统一交互样式 token，控制动效幅度，避免喧宾夺主。

### 3.4 产品逻辑 Bug
- **现象**：完成评测后，MVP 套餐 / 加入方案仍会弹「测评」页；「30 秒生成猫咪方案」按钮仍绑定测评。
- **解法**：把「是否已测评」作为判定条件，评测通过后跳过 / 替换入口，去掉冗余绑定。

### 3.5 数据 / 素材短缺
- **现象**：知识库训练数据偏少，影响 RAG 效果；没有自家商品图。
- **解法**：先用「色块占位 + 分类」跑通；后续用真实拍摄 / AI 生成图；知识库按主题补足（报价 / 配送 / 退换 / 过敏 / 多猫 / 喂食量）。

### 3.6 外部服务配置复杂
- **现象**：Dify 账号密码遗忘、知识库同步困难；飞书自建应用 / webhook / 单人建群 / 多维表格；公网链接 / 隧道；Docker Desktop 未运行。
- **解法**：逐个配置飞书开放平台；对外演示用临时隧道方案 C；Dify / Neo4j 只在演示前拉起。

### 3.7 工程化与安全
- **现象**：要对外演示，需稳定跑通、可复现、可测试；上线不能带入密钥 / 数据。
- **解法**：一键启动、健康检查、测试 / 压测、README；`.gitignore` + 密钥扫描，私有仓库新分支推送。

---

## 4. 测试与压测

### 4.1 单测 + 集成测试
- Vitest（v4）作为 devDependency，在 `vite.config.ts` 注入 `test` 配置（环境 `node`，匹配 `tests/**/*.test.ts`）。
- 4 个测试文件、21 个用例：
  - `tests/recommendation.test.ts`：推荐筛选 / 精确命中 / 规则推荐（8）
  - `tests/site-data.test.ts`：推荐矩阵取值合法性、商品 / 套餐 id 唯一、价格为正（4）
  - `tests/cart.test.ts`：购物车合计、结算消息（3）
  - `tests/server.integration.test.ts`：`/api/health`、`/api/leads` 落库与鉴权（4）

### 4.2 后端集成测试做法（防污染）
- 在测试端口启动独立薄后台子进程。
- 注入临时 `DATA_DIR`（`fs.mkdtemp`），让 `leads.jsonl` 写临时目录。
- 关闭 Dify / 飞书相关 Key（置空），固定 `ADMIN_TOKEN` 验证鉴权。
- 测试结束 `SIGTERM` 关闭子进程并清理临时目录。

### 4.3 压测
- `scripts/load-test.mjs`：零依赖，使用 Node 原生 `http`，统计成功率、吞吐、p50 / p95 / max 延迟。
- 本机实测（`/api/health`，30 并发 / 6 秒）：请求 44,126，成功率 100%，吞吐约 7,352 req/s，p50 = 4ms，p95 = 6ms，max = 50ms。
- **说明**：该数据为本地开发机基准，仅反映薄后台在静态 MVP 下的伸缩性，不代表线上生产容量。

---

## 5. 工程做法与取舍

- **零依赖后台**：后端不引入框架，直接 Node `http`，降低部署与维护成本。
- **环境变量隔离**：`.env` 进 `.gitignore`；`VITE_` 前缀变量会打进浏览器，服务端 Key 只留后端。
- **环境变量优先**：后端读 `.env` 后仍支持 `process.env` 覆盖（`DIFY_*`、`FEISHU_*`、`ADMIN_TOKEN`、`BACKEND_PORT`、`DATA_DIR`），便于 CI / 测试 / 部署注入。
- **可测性优先**：把推荐、购物车等核心规则抽成纯函数，UI 只做渲染与事件。
- **幂等种子数据**：以 `seedId` 标记，重复执行不重复追加。
- **状态降级**：线索上报失败静默降级，线索保留在 `localStorage`，不影响主流程。
- **演示友好**：截图瘦身、健康检查只在本地 / 局域网显示、README 文档化。

---

## 6. 持续优化（路线）

### 6.1 短期 / P2
- **容器化部署**：`Dockerfile` + `docker-compose.yml`（前端静态 + 后端 + Neo4j），一键部署到云。
- **README**：封面排版、截图补充。
- **知识库扩充**：报价 / 配送 / 退换 / 过敏 / 多猫 / 喂食量等主题。
- **Neo4j 图谱可视化**：后端加 `/api/graph/visualize`，前端做交互式力导向图（推荐理由图谱 / 关联商品），页面可按类型过滤、点击高亮、看推荐链。
- **CI 纳入集成测试**：把测试接进 GitHub Actions，和现有 `lint + build` 合并。

### 6.2 中期 / 产品闭环
- 真实商品图、价格、资质、配送范围、真实评价。
- 支付、订单系统、订阅周期管理、用户账号 + 猫咪档案。
- CMS / 后台管理商品、套餐、FAQ、文章。

### 6.3 长期 / 能力与质量
- 真实测评数据积累 → 推荐矩阵样本更可信、命中率更有说服力。
- 图谱价值化：从「内部推理」到「可视化输出」，甚至做成关联商品 / 套餐推荐。
- 密钥管理（不硬编码默认密码）、权限、HTTPS、隐私政策。
- 监控（health / 日志 / 报警）、数据备份、压测场景细化。

### 6.4 面向面试 / 简历的表达要点
- **差异化**：不是纯前台，而是「官网 + AI 客服 + 知识图谱 + 线索闭环 + 运营后台」的全栈项目。
- **工程能力**：RAG、知识图谱推理、SSE 流式、零依赖后端、单测 / 集成测试 / 压测、一键启动、安全收尾。
- **数据口径**：先测评 → 再试吃 → 再订阅的漏斗，以及评测 / 咨询 / 购物车结算统一落地线索并联动飞书。
- **性能数字**：本机 7,352 req/s、p95 6ms（注明是本地基准）。

---

## 7. 复盘总结

### 收获
- 从 0 到 1 全栈：前端视觉 + 交互、后端 API、外部 AI / 图谱、自动化、文档、安全、版本管理。
- 工程化意识：可测性、可复现、可演示、安全边界。
- 用真实反馈驱动迭代：很多交互细节是实际点出来的，比拍脑袋设计更准。

### 不足 / 待改进
- 知识库 / 样本数据偏少，AI 回答质量与可信度受限于早期样本。
- 依赖外部服务（Dify / Neo4j / 飞书），配置与部署链路较长，Docker 未启动会直接断掉 AI / 图谱能力。
- 商品图、价格、评价等是占位或样例，正式商用前需替换。
- 目前是私有仓库 + 临时隧道，没有正式上线与 CI 全链路。

---

## 8. 附录

### 8.1 常用命令

```bash
pnpm install          # 安装依赖
pnpm dev              # 仅前端
pnpm server           # 仅后端
pnpm dev:all          # 前后端一键启动
pnpm seed             # 写入演示种子数据
pnpm test             # 运行全部测试
pnpm test:watch       # 监听模式
pnpm lint             # ESLint
pnpm build            # tsc + vite build
pnpm load-test <url> [并发] [秒] [--with-leads]   # 轻量压测
```

### 8.2 目录结构（要点）

```text
src/
  components/chat/     智能客服组件（ChatWidget / useDifyChat / HumanRequestCard）
  components/Cart.tsx  购物车抽屉（加购、结算留资）
  pages/Admin.tsx      运营后台（看板 / 订单 / 工单）
  data/site.ts         品牌数据层（商品、套餐、推荐矩阵、FAQ 的单一事实源）
  lib/                 纯逻辑模块（recommendation / cart / leads）
  hooks/               自定义 hooks（useBackendHealth 等）
tests/                 Vitest 单测 + 后端集成测试
scripts/
  dev-all.mjs          一键启动前后端
  seed.mjs             演示种子数据
  load-test.mjs        轻量压测
server/
  index.mjs            薄后台入口（代理 / 线索 / webhook / health）
  admin.mjs            管理端 API（订单 / 看板 / 工单状态）
  feishu.mjs           飞书线索同步 / 群推送（可选，未配置静默跳过）
  graph/seed.mjs       图谱建库（从 site.ts 与 FAQ 自动提取，幂等）

knowledge-base/        Dify 知识库文档 + graph-schema.md
docs/                  开发记录、截图、项目复盘
```

### 8.3 关键文件

- `src/data/site.ts`：品牌、商品、套餐、推荐矩阵、FAQ 的单一事实源。
- `server/index.mjs`：薄后台入口与 API 路由。
- `server/graph/query.mjs`：图谱推理 + 意图抽取 + 体重归一。
- `server/graph/seed.mjs`：从站点数据自动建图谱。
- `src/lib/recommendation.ts`、`src/lib/cart.ts`：可测的纯逻辑。
- `knowledge-base/graph-schema.md`：图谱 Schema 设计。
- `docs/DEVELOPMENT_NOTES.md`：本次迭代改动与做法记录。