# AGENT.md

> 智析 ZhiXi 项目 coding agent 总入口。  
> 所有自动化编码模型、IDE Agent、CLI Agent 在修改项目前必须先阅读本文。

---

## 1. 项目一句话

智析 ZhiXi 是一个**演示优先的 RAG 舆情处置建议辅助生成系统**：小样本案例库 → 背景判断字典 → embedding 检索 → 加权重排 → Evidence Pack → 三段式报告生成。

---

## 2. 必读顺序

上下文文档当前位于 `docs/ZhiXi_Context_Docs/`。除本文和 `CLAUDE.md` 在根目录外，引用项目上下文时优先使用完整相对路径。

请按下面顺序读取上下文：

1. `docs/ZhiXi_Context_Docs/ZhiXi_PRD.md`：产品需求源头，决定做什么、不做什么。
2. `docs/ZhiXi_Context_Docs/ZhiXi_Tech.md`：环境、技术栈、项目结构。
3. `docs/ZhiXi_Context_Docs/ZhiXi_Backend.md`：后端架构、API、RAG 流程。
4. `docs/ZhiXi_Context_Docs/ZhiXi_Frontend.md`：前端架构、视觉风格、组件规范。
5. `docs/ZhiXi_Context_Docs/ZhiXi_Test.md`：测试策略和验收。
6. `docs/ZhiXi_Context_Docs/ZhiXi_DevPlan.md`：开发顺序和阶段验收。

如果只做前端任务，至少读：PRD + Tech + Frontend。  
如果只做后端任务，至少读：PRD + Tech + Backend。  
如果改动核心流程，必须读全部文档。

Claude Code 项目级配置位于 `.claude/settings.json`，项目 skill 位于 `.claude/skills/zhixi-context/SKILL.md`。

---

## 3. 硬性产品约束

1. 报告固定三段：
   - 一、舆情画像与历史案例参考
   - 二、处置结论与回应话术
   - 三、免责声明与使用边界
2. 报告必须分段调用生成，不允许一次性生成长报告。
3. 数据库默认 SQLite。
4. LangChain 只能作为可选 adapter，不允许成为核心强依赖。
5. 前端不允许保存或展示 API Key。
6. 所有模型调用必须有 Mock fallback。
7. 检索结果必须展示分数拆解。
8. 不允许声称系统完成真实全网监测。
9. 不允许声称 PSM/DID 已证明策略因果有效。
10. 前端视觉只能转译用户参考图风格，不能复刻具体 IP、Logo、角色或截图素材。

---

## 4. 技术约束

### 4.1 前端

- Vite + React + TypeScript。
- Tailwind + shadcn/ui。
- TanStack Query 管理 API 状态。
- Zod + React Hook Form 管理表单。
- React Router 管理路由。
- Motion 只做克制动效。
- API 请求统一走 `src/api/client.ts`。
- 优先使用 OpenAPI 生成类型。

### 4.2 后端

- FastAPI + SQLite。
- SQLModel 为主，必要时可直接使用 SQLAlchemy 2.x。
- Pydantic v2 schema。
- SQLite 存 embedding JSON，Python numpy 计算 cosine。
- `/docs` 必须可用。
- Mock 模式必须可用。

---

## 5. 核心流程必须保持一致

```text
案例入库
  -> 字段标准化
  -> 背景判断字典补充解释
  -> 构造 case embedding text
  -> 生成/保存 embedding

当前事件输入
  -> 事件画像
  -> 构造 query_text
  -> query embedding
  -> 向量召回 Top-N
  -> 加权重排 Top-K
  -> Evidence Pack
  -> 三段式报告生成
```

---

## 6. 文档之间的逻辑关系复核

已对六份文档进行一致性梳理，关系如下：

```text
docs/ZhiXi_Context_Docs/ZhiXi_PRD.md
  定义产品边界、功能需求、报告结构、核心验收

docs/ZhiXi_Context_Docs/ZhiXi_Frontend.md
  根据 PRD 实现页面、视觉、组件、交互

docs/ZhiXi_Context_Docs/ZhiXi_Backend.md
  根据 PRD 实现 API、SQLite、RAG、报告生成

docs/ZhiXi_Context_Docs/ZhiXi_Tech.md
  汇总 Frontend/Backend 所需技术栈和初始化方式

docs/ZhiXi_Context_Docs/ZhiXi_Test.md
  根据 PRD、Frontend、Backend 设计测试与验收

docs/ZhiXi_Context_Docs/ZhiXi_DevPlan.md
  把 PRD/Tech/Frontend/Backend/Test 排成开发阶段
```

### 6.1 一致性检查结果

- 报告结构一致：六份文档均为三段式报告。
- 数据库选择一致：默认 SQLite，未要求 pgvector。
- LangChain 选择一致：可选 adapter，不是核心依赖。
- 产品边界一致：演示优先，不做实时爬虫和严格因果推断。
- 前后端边界一致：API Key 后端保存，前端只展示配置状态。
- 测试目标一致：优先保证演示闭环和 Mock 模式。
- 风格要求一致：黑色舞台、白灰画布、蓝图线稿、几何节点，不复制 IP 素材。

未发现会阻塞开发的需求矛盾。

---

## 7. 开发工作流

每次实现功能时：

1. 明确当前阶段，对照 `docs/ZhiXi_Context_Docs/ZhiXi_DevPlan.md`。
2. 查阅对应文档：前端看 Frontend，后端看 Backend。
3. 只实现当前阶段任务，不跨阶段大改。
4. 写或更新测试。
5. 运行对应命令。
6. 对照验收标准自检。

---

## 8. 常用命令

### 后端

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
ruff check .
pytest
```

### 前端

```bash
cd frontend
pnpm dev
pnpm gen:api
pnpm lint
pnpm test
pnpm build
pnpm e2e
```

---

## 9. 变更规则

### 9.1 修改 PRD

如果修改 `docs/ZhiXi_Context_Docs/ZhiXi_PRD.md`，必须检查：

- Frontend 是否需要更新。
- Backend 是否需要更新。
- Test 是否需要更新。
- DevPlan 是否需要更新。

### 9.2 修改 API

如果修改后端 API schema，必须：

1. 启动后端。
2. 前端执行 `pnpm gen:api`。
3. 修复 TypeScript 类型错误。
4. 跑前端 build。

### 9.3 修改 RAG 公式

如果修改权重或分数计算，必须更新：

- `docs/ZhiXi_Context_Docs/ZhiXi_PRD.md` 的公式。
- `docs/ZhiXi_Context_Docs/ZhiXi_Backend.md` 的实现说明。
- `docs/ZhiXi_Context_Docs/ZhiXi_Test.md` 的分数测试。

---

## 10. 禁止行为

- 不要把报告扩展成 8 章长报告。
- 不要在前端写死 DeepSeek 或 Qwen API Key。
- 不要引入大型复杂依赖来替代 P0 实现。
- 不要把 UI 做成默认后台管理模板。
- 不要使用用户参考图的原始素材。
- 不要绕过 Evidence Pack 直接让 LLM 根据用户输入自由发挥。
- 不要删除 Mock 模式。

---

## 11. 最小完成标准

一个可接受的 MVP 必须满足：

- 案例库能导入/新增。
- 案例能向量化。
- 输入事件能生成画像。
- 能检索 Top-K 参考案例。
- 能展示相似度拆解。
- 能生成三段式报告。
- 能局部重生成段落。
- 能导出 Markdown。
- Mock 模式可完整演示。
