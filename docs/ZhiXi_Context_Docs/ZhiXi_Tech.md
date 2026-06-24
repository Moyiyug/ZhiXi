# ZhiXi_Tech.md

> 文档版本：v0.2  
> 目标：总结项目所需 skill、技术栈、初始化环境、目录结构、运行命令和开发约定。  
> 依赖文档：`ZhiXi_PRD.md`、`ZhiXi_Frontend.md`、`ZhiXi_Backend.md`

---

## 1. 项目技术栈总览

### 1.1 前端

```text
Node.js 20+
pnpm
Vite
React
TypeScript
Tailwind CSS v4
shadcn/ui
TanStack Query
React Router
Zod
React Hook Form
Motion for React
Recharts 或 Tremor
Vitest
Playwright
```

### 1.2 后端

```text
Python 3.11+
FastAPI
Pydantic v2
SQLModel
SQLite
Uvicorn
httpx
numpy
pandas
openai SDK compatible client
pytest
ruff
```

### 1.3 AI 与 RAG

```text
Embedding：Qwen / DashScope text-embedding-v4
LLM 快速生成：DeepSeek V4 Flash，可配置
LLM 审查/润色：DeepSeek V4 Pro，可配置
Mock 模式：必须支持
LangChain：可选 adapter，不作为核心依赖
```

### 1.4 数据库

```text
默认：SQLite
向量存储：SQLite 存 JSON + Python numpy cosine similarity
可选：SQLite FTS5 做关键词召回
未来：pgvector/Qdrant/Chroma 可迁移，但不属于当前必需项
```

---

## 2. Skill 总结

项目当前同时维护：

- 文档内的“技能”清单：用于拆分 vibe coding 角色与任务关注点。
- Claude Code 项目级 skill：`.claude/skills/zhixi-context/SKILL.md`，用于让 Claude 在实现或复核时按本文档体系加载上下文。

### 2.1 前端技能

- `zhi_xi_ui_style_interpreter`
- `zhi_xi_react_ts_architect`
- `zhi_xi_design_system_builder`
- `zhi_xi_motion_engineer`
- `zhi_xi_api_contract_guard`
- `zhi_xi_demo_polisher`

### 2.2 后端技能

- `zhi_xi_fastapi_contract_builder`
- `zhi_xi_sqlite_case_store`
- `zhi_xi_rag_pipeline_engineer`
- `zhi_xi_prompt_segment_writer`
- `zhi_xi_mock_mode_guard`
- `zhi_xi_backend_test_designer`

### 2.3 测试技能

- `zhi_xi_frontend_unit_tester`
- `zhi_xi_backend_api_tester`
- `zhi_xi_rag_regression_tester`
- `zhi_xi_e2e_demo_tester`

---

## 3. 推荐 Monorepo 结构

```text
zhixi/
  AGENT.md
  CLAUDE.md
  .claude/
    settings.json
    skills/
      zhixi-context/
        SKILL.md
  docs/
    ZhiXi_Context_Docs/
      ZhiXi_PRD.md
      ZhiXi_Frontend.md
      ZhiXi_Backend.md
      ZhiXi_Tech.md
      ZhiXi_Test.md
      ZhiXi_DevPlan.md
  frontend/
    package.json
    vite.config.ts
    tsconfig.json
    components.json
    src/
  backend/
    pyproject.toml
    app/
    scripts/
    tests/
    data/
      zhixi.db
  data/
    Sheet1.csv
  README.md
```

本项目当前采用 `docs/ZhiXi_Context_Docs/` 作为上下文文档目录。代码代理不得假设这些文档在根目录；根目录只保留 `AGENT.md` 和 `CLAUDE.md` 作为入口。

---

## 4. 初始化步骤

## 4.1 创建项目目录

```bash
mkdir zhixi
cd zhixi
mkdir docs data
```

把六份上下文文档放入 `docs/ZhiXi_Context_Docs/`，把 `AGENT.md` 和 `CLAUDE.md` 放入根目录。Claude Code 项目级配置放入 `.claude/settings.json`，项目 skill 放入 `.claude/skills/zhixi-context/SKILL.md`。

---

## 4.2 初始化前端

```bash
pnpm create vite frontend --template react-ts
cd frontend
pnpm install
```

安装依赖：

```bash
pnpm add @tanstack/react-query react-router-dom zod react-hook-form @hookform/resolvers motion lucide-react sonner recharts clsx tailwind-merge
pnpm add -D tailwindcss @tailwindcss/vite vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom playwright openapi-typescript typescript-eslint eslint prettier
```

初始化 shadcn/ui：

```bash
pnpm dlx shadcn@latest init
```

建议添加组件：

```bash
pnpm dlx shadcn@latest add button card badge input textarea select dialog drawer sheet form command separator tabs switch slider skeleton tooltip dropdown-menu
```

### 4.2.1 前端 `.env.example`

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=ZhiXi
```

### 4.2.2 前端 scripts

`frontend/package.json` 建议：

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test",
    "gen:api": "openapi-typescript http://localhost:8000/openapi.json -o src/api/generated.ts"
  }
}
```

---

## 4.3 初始化后端

推荐使用 `uv`，也可以使用标准 venv + pip。

```bash
mkdir backend
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows 使用 .venv\Scripts\activate
pip install -U pip
```

安装依赖：

```bash
pip install fastapi uvicorn sqlmodel pydantic pydantic-settings pandas numpy httpx python-multipart openai pytest ruff
```

可选：

```bash
pip install python-docx langchain langchain-core
```

### 4.3.1 后端 `pyproject.toml`

```toml
[project]
name = "zhixi-backend"
version = "0.1.0"
requires-python = ">=3.11"

dependencies = [
  "fastapi",
  "uvicorn[standard]",
  "sqlmodel",
  "pydantic",
  "pydantic-settings",
  "pandas",
  "numpy",
  "httpx",
  "python-multipart",
  "openai",
]

[project.optional-dependencies]
dev = ["pytest", "ruff"]

[tool.ruff]
line-length = 100
target-version = "py311"

[tool.ruff.lint]
select = ["E", "F", "I", "UP", "B"]
```

### 4.3.2 后端 `.env.example`

```env
APP_ENV=development
APP_DEBUG=true
APP_MOCK_MODE=true
DATABASE_URL=sqlite:///./data/zhixi.db
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173

DASHSCOPE_API_KEY=
QWEN_EMBEDDING_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
QWEN_EMBEDDING_MODEL=text-embedding-v4
QWEN_EMBEDDING_DIMENSIONS=1024

DEEPSEEK_API_KEY=
DEEPSEEK_BASE_URL=https://api.deepseek.com
DEEPSEEK_MODEL_FAST=deepseek-v4-flash
DEEPSEEK_MODEL_PRO=deepseek-v4-pro

RETRIEVAL_TOP_N=10
RETRIEVAL_TOP_K=3
WEIGHT_SEMANTIC=0.45
WEIGHT_DEMAND=0.20
WEIGHT_HEAT=0.15
WEIGHT_DOMAIN=0.10
WEIGHT_EFFECT=0.10
```

---

## 5. 启动命令

### 5.1 后端

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

访问：

```text
http://localhost:8000/docs
```

### 5.2 前端

```bash
cd frontend
pnpm dev
```

访问：

```text
http://localhost:5173
```

### 5.3 生成 API 类型

确保后端启动后：

```bash
cd frontend
pnpm gen:api
```

---

## 6. 数据初始化

### 6.1 放置 CSV

```text
data/Sheet1.csv
```

或使用前端 `/cases` 页面上传。

### 6.2 后端脚本导入

```bash
cd backend
python scripts/import_csv.py ../data/Sheet1.csv
python scripts/rebuild_embeddings.py
```

在 Mock 模式下，`rebuild_embeddings.py` 应生成 deterministic fake embeddings。

---

## 7. OpenAPI 契约工作流

```text
后端修改 schemas 或 routes
  -> 启动后端
  -> frontend 执行 pnpm gen:api
  -> 前端根据 generated.ts 修复类型
  -> 运行 pnpm build
```

禁止手写与后端不一致的前端类型。

---

## 8. Git 分支和提交建议

```text
main
  feat/backend-core
  feat/frontend-shell
  feat/rag-pipeline
  feat/report-editor
  feat/demo-polish
```

提交格式：

```text
feat(frontend): add report canvas layout
feat(backend): implement weighted rerank service
fix(rag): normalize missing effect score
chore(docs): update PRD acceptance criteria
```

---

## 9. 环境变量安全

- `.env` 不提交。
- `.env.example` 提交。
- API Key 只在后端。
- 前端不读取 DeepSeek/Qwen key。
- 设置页只显示 key 是否配置。

---

## 10. Mock 模式规范

Mock 模式是演示安全网，必须长期保留。

### 10.1 Mock Embedding

根据文本 hash 生成固定长度向量，确保同样文本每次结果一致。

### 10.2 Mock Profile

根据关键词规则生成画像。

### 10.3 Mock Report

根据 Evidence Pack 模板生成三段式报告。

### 10.4 验收

- [ ] 无 API Key 也能跑完整流程。
- [ ] Mock 输出稳定，便于测试。
- [ ] UI 明确显示当前是 Mock 模式。

---

## 11. 技术债控制

### 11.1 不要过早引入

- Redux。
- Next.js。
- Postgres/pgvector。
- Celery。
- LangGraph。
- 多 Agent 框架。

### 11.2 可后续替换

- SQLite vector JSON -> pgvector。
- 手写 Prompt -> PromptTemplate。
- 本地 cosine -> FAISS/Qdrant。
- Markdown 导出 -> docx/PDF。

---

## 12. 初始化验收清单

- [ ] 前端 `pnpm dev` 成功。
- [ ] 后端 `uvicorn app.main:app --reload` 成功。
- [ ] `/api/health` 返回 ok。
- [ ] `/docs` 可访问。
- [ ] 前端可以请求 dashboard summary。
- [ ] `pnpm gen:api` 成功。
- [ ] Mock 模式下能完成一次报告生成。
