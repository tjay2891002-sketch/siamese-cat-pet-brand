# 基米厨房 · 项目开发记录

> 本文档记录本次迭代的功能改动、工程化做法、自动化测试与压测结果，后续可作为 README 的补充或简历/答辩素材。

## 1. 项目概览

基米厨房是一款面向「宠物鲜食」的品牌全栈项目，围绕「先测评、再试吃、再订阅」的高转化漏斗展开。

- 前端：React 19 + Vite + TypeScript + Tailwind CSS + wouter（hash 路由）
- 后端：零依赖 Node 薄后台（`server/index.mjs`）
- AI：Dify 对话代理（SSE 透传）＋ 知识库 RAG + Neo4j 知识图谱
- 集成：飞书群机器人通知、飞书多维表格线索沉淀
- 数据：`leads.jsonl` 线索落库、`orders.json` 模拟订单、知识库 Markdown

## 2. 本次改动一览

### 2.1 品牌调整
- 品牌名由「九命鲜厨 / NINE LIVES KITCHEN」改为「基米厨房 / KIMI KITCHEN」。
- 同步更新站点配置、首页、管理端、线索组件、后端、知识库与 README。
- 保留内部缓存 key、Neo4j 密码默认值、容器名，避免重置已有数据与连接。

### 2.2 导航与体验
- 导航当前页高亮：当前页按钮使用与「鼠标悬停」一致的克制样式（浅底色 + 主题橙文字）。
- 首页品牌字带淡淡的白色微光，切到测评/用品后自动消失。
- 修复页面切换滚动串页：为首页/测评/用品分别记录独立滚动位置，首次进入回到顶部，切回时恢复各自位置，互不混合。
- 修复测评/用品页左上角被固定导航遮挡，顶部留白加大。

### 2.3 P0 · 让演示稳定跑通
- `pnpm dev:all`：一键同时启动前端 + 后端（跨平台、零额外依赖），Ctrl+C 一起关闭。
- 后端 `GET /api/health`：返回运行时间与 Dify/飞书配置状态。
- 前端连接状态指示：轮询 `/api/health`，仅在「本地 / 局域网」访问时显示（localhost、127.0.0.1、::1、`*.local`、IPv4 私网、IPv6 ULA/链路本地），外部隧道/公网自动隐藏，避免演示时误显示「服务离线」。
- `pnpm seed`：生成演示种子数据（8 条测评 + 4 条咨询 + 4 条人工工单），幂等，中文无乱码。

### 2.4 P1 · 自动化测试与压测
- 抽取纯逻辑模块，便于单测：
  - `src/lib/recommendation.ts`：`matchesTrendFilters` / `findExactMatch` / `getRecommendation`
  - `src/lib/cart.ts`：`calcTotal` / `buildCheckoutSummary`
- 接入 Vitest，覆盖推荐匹配、数据完整性、购物车结算、后端集成。
- 新增零依赖压测脚本 `scripts/load-test.mjs`。

## 3. 开发与验证命令

```bash
pnpm install          # 安装依赖
pnpm dev              # 仅前端
pnpm server           # 仅后端
pnpm dev:all          # 前后端一起启动
pnpm seed             # 写入演示种子数据
pnpm test             # 运行全部测试
pnpm test:watch       # 监听模式
pnpm lint             # ESLint
pnpm build            # tsc + vite build
pnpm load-test <url> [并发] [秒] [--with-leads]  # 轻量压测
```

## 4. 自动化测试体系

### 4.1 配置
- Vitest 已作为 devDependency（v4.x），在 `vite.config.ts` 中注入 `test` 配置：
  - 环境 `node`，测试匹配 `tests/**/*.test.ts`。

### 4.2 抽取的纯函数
- `src/lib/recommendation.ts`：把推荐矩阵筛选、精确匹配、规则推荐从 UI 组件中抽出，成为可测的纯函数。
- `src/lib/cart.ts`：购物车合计与结算消息生成。

### 4.3 测试覆盖
| 文件 | 覆盖点 | 用例数 |
| --- | --- | --- |
| `tests/recommendation.test.ts` | 推荐筛选、精确命中、规则推荐 | 8 |
| `tests/site-data.test.ts` | 推荐矩阵取值合法性、商品/套餐 id 唯一、价格为正 | 4 |
| `tests/cart.test.ts` | 购物车合计、结算消息 | 3 |
| `tests/server.integration.test.ts` | `/api/health`、`/api/leads` 落库与鉴权 | 4 |

共 4 个测试文件、21 个用例，全部通过。

### 4.4 后端集成测试的做法
为防止测试污染真实数据或触发飞书推送：
- 在测试端口启动一个独立的薄后台子进程。
- 通过环境变量注入临时 `DATA_DIR`（`fs.mkdtemp`），让 `leads.jsonl` 写入临时目录。
- 关闭 Dify 与飞书相关 Key（`DIFY_API_KEY`、`FEISHU_APP_ID`、`FEISHU_APP_SECRET`、`FEISHU_CHAT_ID`、`NOTIFY_WEBHOOK_URL` 置空）。
- 固定 `ADMIN_TOKEN`，用以验证线索查看接口的鉴权。
- 测试结束 `SIGTERM` 关闭子进程并清理临时目录。

## 5. 压测说明

### 5.1 脚本
`scripts/load-test.mjs`：零依赖，使用 Node 原生 `http`，并发发起请求，统计成功率、吞吐、p50/p95/max 延迟。

用法：
```bash
# 仅打健康检查，30 并发、6 秒
pnpm load-test http://localhost:8787 30 6

# 同时打线索接口（注意会在数据目录写入压测线索）
pnpm load-test http://localhost:8787 20 5 --with-leads
```

### 5.2 本次实测结果（本机，30 并发 / 6 秒 / `/api/health`）
- 请求总数：44,126
- 成功率：100.00%（成功 44126，失败 0）
- 吞吐：约 7,352 req/s
- 延迟：p50 = 4ms，p95 = 6ms，max = 50ms

> 说明：该数据为本地开发机的基准，仅反映「薄后台」在静态 MVP 场景下的伸缩性；不代表线上生产容量，可作为演示参考而非性能承诺。

## 6. 工程做法与取舍

- **零依赖后台**：后端不引入第三方框架，直接用 Node `http`，降低部署与维护成本。
- **环境变量隔离**：`.env` 已进 `.gitignore`；前端 `VITE_` 前缀变量会打进浏览器，后端 Key 只留在服务端。
- **环境变量优先**：后端读取 `.env` 后，支持以 `process.env` 覆盖（`DIFY_*`、`FEISHU_*`、`ADMIN_TOKEN`、`BACKEND_PORT`、`DATA_DIR`），便于 CI、测试与部署注入；`DATA_DIR` 可重定向，方便测试隔离。
- **幂等种子数据**：以 `seedId` 标记，重复执行不重复追加。
- **前端状态降级**：线索上报失败静默降级，线索仍保留在浏览器 localStorage，不影响主流程。
- **可测性优先**：把推荐、购物车等核心规则抽成纯函数，UI 组件只做渲染与事件，便于单测。

## 7. 后续路线（P2 / P3）

- 容器化部署：`Dockerfile` + `docker-compose.yml`（前端静态 + 后端 + Neo4j），一键部署到云。
- README 升级：补架构图、目录说明、部署步骤与功能截图。
- 知识库扩充：按报价/配送/退换/过敏/多猫/喂食量等主题补足 RAG 数据。
- Neo4j 价值化：把知识图谱做成「推荐理由图谱」或「关联商品/套餐推荐」，让图谱有可视化输出。
- 上 GitHub 前安全收尾：清理 `*.example` 旧品牌残留、加密钥扫描、确认不提交 `leads.jsonl` 与 `.env`。
