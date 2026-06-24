# CLAUDE.md

> Claude Code / Claude Agent 专用上下文入口。  
> 若你是 Claude，请先读本文件，再按本文指示读取其他文档。

---

## 1. 你正在开发什么

你正在开发 **智析 ZhiXi**：一个面向数学建模结课作业演示的 RAG 舆情处置建议辅助生成系统。

核心流程：

```text
小样本案例库 -> 背景判断字典 -> embedding -> 向量召回 -> 加权重排 -> Evidence Pack -> 三段式报告
```

这是演示产品，不是真实舆情处置系统。

---

## 2. 必读文件

上下文文档当前位于 `docs/ZhiXi_Context_Docs/`。不要假设这些文档在根目录。

请按顺序读取：

1. `AGENT.md`
2. `docs/ZhiXi_Context_Docs/ZhiXi_PRD.md`
3. `docs/ZhiXi_Context_Docs/ZhiXi_Tech.md`
4. 当前任务相关文档：
   - 前端任务读 `docs/ZhiXi_Context_Docs/ZhiXi_Frontend.md`
   - 后端任务读 `docs/ZhiXi_Context_Docs/ZhiXi_Backend.md`
   - 测试任务读 `docs/ZhiXi_Context_Docs/ZhiXi_Test.md`
   - 计划/排期读 `docs/ZhiXi_Context_Docs/ZhiXi_DevPlan.md`

项目级 Claude Code 配置位于 `.claude/settings.json`，项目 skill 位于 `.claude/skills/zhixi-context/SKILL.md`。处理 ZhiXi 相关实现、评审或上下文校验时，可以直接使用 `/zhixi-context`。

如果你无法一次性读取所有文档，优先读 PRD 和当前任务相关文档。

---

## 3. 开发铁律

1. 报告只有三段，不要扩写成长报告。
2. 每段报告单独生成。
3. Evidence Pack 是报告唯一依据。
4. SQLite 是默认数据库。
5. LangChain 是可选 adapter，不是核心。
6. Mock 模式必须保留。
7. 前端不接触 API Key。
8. 风格必须是黑色舞台、白灰画布、蓝图线稿、几何节点。
9. 不复制用户参考图里的角色、Logo、Bilibili UI、明日方舟素材。
10. 不声称真实全网监测或因果证明。

---

## 4. 推荐实现顺序

如果用户没有指定任务，请按 `docs/ZhiXi_Context_Docs/ZhiXi_DevPlan.md` 顺序推进：

1. 后端 health + SQLite。
2. 案例 CRUD + CSV 导入。
3. 字典 + embedding mock。
4. RAG 检索 + 重排。
5. Evidence Pack + 报告生成。
6. 前端 AppShell + 视觉系统。
7. 案例库 UI。
8. 智能生成 UI。
9. 报告编辑 UI。
10. 测试和演示 polish。

---

## 5. 代码修改原则

- 小步提交式修改，避免一次生成超大文件。
- 不要重写无关模块。
- 新增功能时同步考虑 loading/error/empty 状态。
- 新增后端接口时同步更新 schema 和测试。
- 新增前端 API 调用时走统一 client。
- 尽量保留文档中的命名和目录结构。

---

## 6. 前端任务提示

当实现前端时：

```text
请遵守 `docs/ZhiXi_Context_Docs/ZhiXi_Frontend.md`。
使用 Vite + React + TypeScript + Tailwind + shadcn/ui + TanStack Query。
使用 React Router，不切换到 TanStack Router，除非先同步更新 Tech、Frontend 和 DevPlan。
页面必须有强风格，但内容可读性优先。
所有数据请求走 src/api/client.ts。
如果后端还没实现，用 mock API 或本地 mock 数据，但保留真实 API 调用接口。
```

### 前端必须优先完成

- `/cases`
- `/generate`
- `/reports/:id`

P0 路径稳定后，再补 `/settings` 和 `/evaluation` 两个 P1 页面。

---

## 7. 后端任务提示

当实现后端时：

```text
请遵守 `docs/ZhiXi_Context_Docs/ZhiXi_Backend.md`。
使用 FastAPI + SQLite。
以 SQLModel + Pydantic v2 为主。
实现 Mock 模式，不要依赖真实 API Key 才能跑通。
RAG 检索必须返回分数拆解。
报告生成必须分段。
```

### 后端必须优先完成

- `/api/health`
- `/api/cases`
- `/api/events/profile`
- `/api/rag/retrieve`
- `/api/reports`

P1 接口也必须保留契约：`/api/settings/public` 与 `/api/evaluation/run-demo`。

---

## 8. 测试任务提示

当写测试时：

```text
请遵守 `docs/ZhiXi_Context_Docs/ZhiXi_Test.md`。
优先覆盖核心演示路径。
后端使用临时 SQLite 和 Mock client。
前端使用 Vitest 测组件，Playwright 测完整 demo flow。
```

---

## 9. 常用命令

### 后端

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pytest
ruff check .
```

### 前端

```bash
cd frontend
pnpm dev
pnpm gen:api
pnpm test
pnpm build
pnpm e2e
```

---

## 10. 完成后自检

每次完成任务后，回答或提交前自检：

- 是否符合 PRD？
- 是否破坏三段式报告？
- 是否仍支持 Mock 模式？
- 是否有 API Key 泄露风险？
- 是否更新测试或至少说明未测试原因？
- 是否满足对应文档的验收标准？

---

## 11. 面向 Claude 的上下文压缩说明

如果上下文窗口不足，请保留以下最小事实：

```text
ZhiXi = 演示优先 RAG 舆情处置建议生成系统。
报告固定三段：画像+案例；结论+话术；免责声明。
技术：React TS + FastAPI + SQLite。
RAG：字典 -> query_text -> embedding -> Top-N -> 加权重排 -> Evidence Pack -> 分段生成。
UI：黑色舞台 + 白灰画布 + 蓝图线稿 + 几何节点，不复制参考图 IP。
Mock 模式必须可用。
```
