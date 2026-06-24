# ZhiXi 智析

基于小样本案例库的 RAG 舆情处置建议辅助生成系统（课程项目演示原型）。

## 快速开始

### 环境要求

- Python 3.11+
- Node.js 20+
- pnpm

### 后端

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate     # Windows
pip install -r requirements.txt  # 或 pip install fastapi uvicorn sqlmodel pydantic pydantic-settings pandas numpy httpx python-multipart openai pytest ruff
cp .env.example .env           # 默认 Mock 模式，无需 API Key
python scripts/import_csv.py ../data/Sheet1.csv
python scripts/rebuild_embeddings.py
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 前端

```bash
cd frontend
pnpm install
pnpm dev
```

访问 http://localhost:5173

### 运行测试

```bash
# 后端
cd backend && pytest

# 前端
cd frontend && pnpm test && pnpm build
```

## 演示脚本

1. 打开工作台 `/` — 查看系统状态
2. 打开案例素材库 `/cases` — 浏览 28 条历史案例
3. 打开智能生成 `/generate` — 输入事件文本（或点击示例）
4. 点击「生成事件画像」— 系统自动分析领域/诉求/热度
5. 可选编辑画像字段后点击「检索参考案例」
6. 查看 Top-3 参考案例 + 相似度拆解
7. 点击「生成三段式报告」— 跳转报告页
8. 查看三段内容 + 重新生成/复制/导出
9. 打开设置 `/settings` — 查看 Mock 模式 + 检索权重
10. 打开评估 `/evaluation` — 运行固定测试事件

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | Vite + React 19 + TypeScript + Tailwind v4 + shadcn/ui + TanStack Query |
| 后端 | FastAPI + SQLModel + SQLite + Pydantic v2 |
| RAG | Qwen Embedding / Mock + cosine similarity + 5 因子加权重排 |
| 测试 | pytest + Vitest + Playwright |

## 项目结构

```text
frontend/   — React SPA (6 路由)
backend/    — FastAPI REST API (15 端点)
data/       — 原始 CSV 案例数据
docs/       — PRD / Tech / Backend / Frontend / Test / DevPlan
.claude/    — Claude Code skills + settings
```

## 免责声明

本项目为课程演示原型，案例库为小样本数据集（28 条），报告仅作辅助参考，不构成真实舆情处置决策。
