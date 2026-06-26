# ZhiXi 智析

基于小样本案例库的 RAG 舆情处置建议辅助生成系统。

> 演示优先 · 三段式报告 · 可解释检索 · Mock 模式完整闭环 · 真实 API 可烟测

---

## 快速启动

以下命令按 Windows PowerShell 5.1 写法整理，可以直接在当前项目结构下复制执行。外部案例数据位于 `data/Sheet1.csv`。

### 环境要求

| 工具 | 最低版本 |
|---|---|
| Python | 3.11 |
| Node.js | 20.19 或 22.12 |
| npm | 9 |

> 说明：本项目脚本可以用 npm 运行。Windows PowerShell 下裸 `pnpm` 可能被执行策略拦截，所以 README 默认使用 `npm.cmd`。

### 1. 后端

```powershell
cd D:\MyProject\ZhiXi\backend

# 首次运行时创建虚拟环境
if (!(Test-Path .venv)) { python -m venv .venv }

# 安装后端运行依赖
.\.venv\Scripts\python.exe -m pip install -r requirements.txt

# 首次运行时创建环境变量文件；不会覆盖已有 .env
if (!(Test-Path .env)) { Copy-Item .env.example .env }

# 首次初始化或 data/Sheet1.csv 更新后运行
.\.venv\Scripts\python.exe scripts\import_csv.py ..\data\Sheet1.csv
.\.venv\Scripts\python.exe scripts\rebuild_embeddings.py

# 启动后端
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

如果已有 `backend/.env` 中 `APP_MOCK_MODE=false`，`rebuild_embeddings.py` 会调用真实 embedding API。只想本地演示时请先改为 `APP_MOCK_MODE=true`。

访问：

- API 文档：http://127.0.0.1:8000/docs
- Health Check：http://127.0.0.1:8000/api/health

### 2. 前端

另开一个 PowerShell 窗口：

```powershell
cd D:\MyProject\ZhiXi\frontend

npm.cmd install

if (!(Test-Path .env)) { Copy-Item .env.example .env }

# 可选：后端已启动时重新生成 OpenAPI 类型
npm.cmd run gen:api

npm.cmd run dev -- --host 127.0.0.1
```

访问：http://127.0.0.1:5173

### 3. 日常启动

已经安装依赖并初始化数据后，只需要开两个终端：

```powershell
# 终端 1：后端
cd D:\MyProject\ZhiXi\backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

```powershell
# 终端 2：前端
cd D:\MyProject\ZhiXi\frontend
npm.cmd run dev -- --host 127.0.0.1
```

---

## Mock 与真实 API

后端配置项名称是 `APP_MOCK_MODE`，不是 `APP_MODE`。

- `APP_MOCK_MODE=true`：默认演示模式，不调用外部模型 API，可以完整走通前后端流程。
- `APP_MOCK_MODE=false`：真实模型模式，需要在 `backend/.env` 中配置 `DASHSCOPE_API_KEY` 和 `DEEPSEEK_API_KEY`。
- 如果 `APP_MOCK_MODE=true`，任何冒烟测试都只能证明 Mock 链路，不能证明真实 API 链路。

### 真实 API smoke

`backend/scripts/smoke_real_api.py` 会在当前进程内强制 `APP_MOCK_MODE=false`，使用临时 SQLite 数据库，真实调用 DashScope embedding 和 DeepSeek chat，并断言返回模型不是 mock。

```powershell
cd D:\MyProject\ZhiXi\backend
.\.venv\Scripts\python.exe scripts\smoke_real_api.py
```

运行前请确认 `backend/.env` 至少包含：

```dotenv
DASHSCOPE_API_KEY=你的 DashScope Key
DEEPSEEK_API_KEY=你的 DeepSeek Key
```

该 smoke 会消耗真实 API 配额。通过时会输出非敏感 JSON 摘要，例如模型名、画像来源、报告状态和 Markdown 长度。

---

## 项目定位

智析 ZhiXi 是一个用于数学建模结课作业展示的 RAG 辅助写作系统原型：

```text
小样本案例库
  → 背景判断字典
  → embedding
  → 向量召回
  → 加权重排
  → Evidence Pack
  → 三段式报告
```

它不是线上舆情监测平台，也不是严肃决策系统。报告中的建议仅基于有限历史案例和模型生成结果，不构成真实处置决策。

---

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vite + React 19 + TypeScript 6 + Tailwind CSS v4 + shadcn/ui |
| 状态管理 | TanStack Query v5 |
| 路由 | React Router v7 |
| 表单 | React Hook Form + Zod v4 |
| 后端 | FastAPI + Pydantic v2 + SQLModel |
| 数据库 | SQLite，向量存 JSON，NumPy 计算余弦相似度 |
| AI 模型 | Qwen text-embedding-v4 / DeepSeek V4，可 Mock |
| 测试 | pytest + Vitest + Playwright |

---

## 项目结构

```text
ZhiXi/
  AGENT.md
  CLAUDE.md
  README.md
  data/
    Sheet1.csv
  backend/
    app/
      api/
      clients/
      core/
      db/
      models/
      prompts/
      schemas/
      services/
      utils/
    scripts/
      import_csv.py
      rebuild_embeddings.py
      smoke_real_api.py
    tests/
    requirements.txt
  frontend/
    src/
      api/
      app/
      components/
      pages/
      schemas/
      styles/
      types/
    e2e/
    playwright.config.ts
```

---

## 页面路由

| 路由 | 页面 | 说明 |
|---|---|---|
| `/` | 工作台 | 系统状态、指标卡片、RAG 流程图、最近报告 |
| `/cases` | 案例素材库 | CRUD、CSV 导入、筛选、向量化管理 |
| `/generate` | 智能生成 | 输入事件、画像、检索、生成报告 |
| `/reports/:id` | 报告编辑 | 三段式报告、局部重生成、复制、导出 Markdown |
| `/settings` | 设置 | 模型名、Key 状态、检索权重、字典查看 |
| `/evaluation` | 简单评估 | 固定测试事件、Top-K 结果、人工评分 |

---

## 核心 RAG 管线

```text
当前事件输入
  → 事件画像：领域 / 诉求 / 热度 / 风险关键词
  → 背景判断字典补充解释
  → 构造标准化 query_text
  → query embedding
  → 向量召回 Top-10
  → 加权重排

      FinalScore = 0.45 × SemanticScore
                 + 0.20 × DemandScore
                 + 0.15 × HeatScore
                 + 0.10 × DomainScore
                 + 0.10 × EffectScore

  → Top-3 参考案例 + 分数拆解
  → Evidence Pack
  → 分段 LLM 调用生成三段式报告
```

---

## 三段式报告

报告固定为三段，每段独立生成、可单独重生成：

1. 舆情画像与历史案例参考：事件类型判断、公众诉求、风险等级、Top-K 案例参考价值。
2. 处置结论与回应话术：推荐方向、首轮回应重点、后续补救、回应话术。
3. 免责声明与使用边界：小样本限制、模型生成限制、不构成决策依据、需人工复核。

---

## 常用命令

### 后端

```powershell
cd D:\MyProject\ZhiXi\backend

.\.venv\Scripts\python.exe -m pytest
.\.venv\Scripts\python.exe -m ruff check .
.\.venv\Scripts\python.exe scripts\smoke_real_api.py
```

### 前端

```powershell
cd D:\MyProject\ZhiXi\frontend

npm.cmd run test
npm.cmd run build
npm.cmd run lint

# E2E 前请先启动后端
npm.cmd run e2e
```

---

## 开发约定

- 报告固定三段，不扩写成长报告。
- Evidence Pack 是报告唯一依据。
- 前端不接触 API Key。
- 所有模型调用必须有 Mock fallback。
- 不声称真实全网监测、热搜排名或因果证明。
- 报告输出必须包含人工复核和使用边界。

详见 `AGENT.md` 和 `CLAUDE.md`。

---

## License

本项目为课程项目原型，仅供学习和演示使用。
