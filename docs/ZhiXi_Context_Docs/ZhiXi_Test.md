# ZhiXi_Test.md

> 文档版本：v0.2  
> 目标：为智析 ZhiXi 提供完整测试策略、用例设计、测试数据、验收标准和 vibe coding 上下文。  
> 依赖文档：`ZhiXi_PRD.md`、`ZhiXi_Frontend.md`、`ZhiXi_Backend.md`、`ZhiXi_Tech.md`

---

## 1. 测试目标

本项目是演示优先的课程原型，测试目标不是覆盖企业级所有场景，而是保证：

1. 核心演示路径稳定。
2. 案例入库、检索、分段报告生成闭环可用。
3. 小样本 RAG 逻辑可解释且不出现明显错误。
4. 前后端 API 字段一致。
5. 无 API Key 时 Mock 模式可完整演示。
6. 报告不生成违反 PRD 的长报告或虚构性表述。

---

## 2. 测试技术栈

### 2.1 前端

```text
Vitest
React Testing Library
Testing Library user-event
Playwright
```

参考：

- Vitest：`https://vitest.dev/`
- Playwright：`https://playwright.dev/`

### 2.2 后端

```text
pytest
FastAPI TestClient
httpx
临时 SQLite 数据库
Mock LLM/Embedding client
```

参考：

- FastAPI Testing：`https://fastapi.tiangolo.com/tutorial/testing/`

### 2.3 静态检查

```text
frontend: eslint + TypeScript build
backend: ruff check + ruff format --check
```

参考：

- Ruff：`https://docs.astral.sh/ruff/`

---

## 3. 测试分层

| 层级 | 目标 | 工具 | 必须性 |
|---|---|---|---|
| Unit | 函数和组件逻辑 | Vitest / pytest | P0 |
| Integration | API + SQLite + Service | pytest + TestClient | P0 |
| Contract | 前后端类型一致 | OpenAPI + TS build | P0 |
| E2E | 完整演示路径 | Playwright | P1，但答辩前必须跑 |
| Prompt Regression | 报告结构不跑偏 | pytest mock/golden | P0 |
| Visual Smoke | 风格不崩 | Playwright screenshot | P1 |

---

## 4. 后端测试设计

## 4.1 测试目录

```text
backend/tests/
  conftest.py
  unit/
    test_normalize.py
    test_text_builders.py
    test_scores.py
    test_prompt_rules.py
  integration/
    test_cases_api.py
    test_rag_api.py
    test_reports_api.py
    test_settings_api.py
    test_evaluation_api.py
    test_csv_import.py
  fixtures/
    sample_cases.csv
    sample_payloads.py
```

### 4.1.1 `conftest.py` 要求

- 使用临时 SQLite。
- 开启 `APP_MOCK_MODE=true`。
- 覆盖外部模型 client。
- 每个测试隔离数据。

示例：

```python
import pytest
from fastapi.testclient import TestClient

from app.main import create_app
from app.db.session import init_test_db

@pytest.fixture()
def client(tmp_path):
    db_path = tmp_path / "test.db"
    app = create_app(database_url=f"sqlite:///{db_path}", mock_mode=True)
    init_test_db(app)
    return TestClient(app)
```

---

## 4.2 单元测试：字段清洗

### 测试目标

CSV 中存在 `Unnamed:*` 空列、复杂中文列名、热度等级文本、策略类型多选。必须能清洗。

### 用例

| 用例 | 输入 | 期望 |
|---|---|---|
| 删除空列 | `Unnamed: 25` | 不进入 Case |
| 提取热度 | `5级（主榜前3/“爆”）` | `heat_level=5` |
| 提取效果 | `4级（显著修复）` | `effect_score=4` |
| 拆分策略 | `行动补救型,快速道歉型` | `['行动补救型','快速道歉型']` |
| 空字段 | NaN | None 或 [] |

---

## 4.3 单元测试：分数计算

### 4.3.1 demand_score

- 完全匹配：1.0。
- 部分匹配：交并比。
- 一方为空：0.5。

### 4.3.2 heat_score

- 同级：1.0。
- 相差 1：0.75。
- 相差 4：0.0。

### 4.3.2.1 domain_score

使用字典关系矩阵查表：

- 相同领域：1.0。
- 字典中定义的相关领域（如"思想政治教育类"↔"文化传播类"）：矩阵中定义的值（如 0.5）。
- 未定义关系：0.0。
- "其他"与任何领域：字典矩阵中定义的对应值（如 0.5）。

### 4.3.3 final_score

使用固定输入验证权重：

```python
def test_final_score_weighted_sum():
    scores = {
        "semantic": 0.8,
        "demand": 1.0,
        "heat": 0.75,
        "domain": 1.0,
        "effect": 0.8,
    }
    weights = {
        "semantic": 0.45,
        "demand": 0.20,
        "heat": 0.15,
        "domain": 0.10,
        "effect": 0.10,
    }
    assert final_score(scores, weights) == 0.8525
```

---

## 4.4 单元测试：Embedding 文本构造

### 目标

确保案例 embedding 文本和 query_text 使用同一套背景判断字典。

### 检查点

- 包含案例名称。
- 包含领域。
- 包含公众诉求及解释。
- 包含热度等级及解释。
- 包含核心处置策略。
- 不包含 `nan`、`None` 字样。

---

## 4.5 集成测试：案例 API

### 用例

| API | 测试 |
|---|---|
| `POST /api/cases` | 创建案例成功 |
| `GET /api/cases` | 能列表返回 |
| `PUT /api/cases/{id}` | 修改后 embedding_status 变为 none |
| `POST /api/cases/{id}/toggle` | 停用后不参与检索 |
| `DELETE /api/cases/{id}` | 删除后 404 |
| `POST /api/cases/import-csv` | 导入样例 CSV 成功 |

---

## 4.6 集成测试：RAG API

### 测试数据

至少构造 3 条案例：

1. 高校食品安全，诉求：信息公开、问责，热度 4。
2. 景区互动争议，诉求：道歉，热度 5。
3. 政务通报争议，诉求：信息公开、问责，热度 4。

### 测试目标

输入高校食品安全事件，Top-K 应优先返回同类或诉求相近案例。

### 检查点

- 返回 `query_text`。
- 返回 `results`。
- 每条 result 有五个拆解分。
- `final_score` 在 0-1。
- 停用案例不出现。
- 无 ready embedding 时返回空结果和说明。

---

## 4.7 集成测试：报告 API

### 用例

| 用例 | 期望 |
|---|---|
| 创建报告 | 生成 3 个 segments |
| 分段生成 | 每段 `generation_status=ready` |
| 局部重生成 | 只改变对应段落，`regenerated_count+1` |
| Markdown 导出 | 包含三个固定标题 |
| Mock 模式 | 无 API Key 也成功 |

### Prompt 结构回归

报告必须包含且只包含这三个主标题：

```text
一、舆情画像与历史案例参考
二、处置结论与回应话术
三、免责声明与使用边界
```

不允许出现：

```text
传播路径分析
社交网络拓扑分析
PSM 因果识别结论
DID 实证结果
全网监测显示
```

---

## 4.8 集成测试：设置与评估 API

### 设置 API

| API | 测试 |
|---|---|
| `GET /api/settings/public` | 返回 mock_mode、模型名、检索权重和 key 状态 |

检查点：

- 不返回真实 API Key。
- key 状态只允许 `configured` / `missing` 等状态值。
- 检索权重与 PRD/Backend 文档中的公式一致。

### 评估 API

| API | 测试 |
|---|---|
| `POST /api/evaluation/run-demo` | 固定样例能运行并返回 Top-K 与轻量指标 |

检查点：

- 可使用 `golden_event_1` 等固定样例。
- 返回 `profile`、`results` 和 `metrics`。
- `average_final_score` 在 0-1 范围内。
- 不声称严格因果推断或真实全网监测。

---

## 5. 前端测试设计

## 5.1 测试目录

```text
frontend/src/
  components/
    cases/__tests__/CaseCard.test.tsx
    generate/__tests__/SimilarityBreakdown.test.tsx
    reports/__tests__/ReportSegmentCard.test.tsx
  pages/__tests__/
    GeneratePage.test.tsx
  lib/__tests__/
    scores.test.ts
frontend/e2e/
  demo-flow.spec.ts
  report-regenerate.spec.ts
```

---

## 5.2 组件测试

### 5.2.1 CaseCard

检查：

- 渲染案例名称。
- 渲染领域 badge。
- 渲染热度等级。
- 渲染向量状态。
- 点击详情触发回调。

### 5.2.2 SimilarityBreakdown

检查：

- 显示 final_score。
- 显示五个子分数。
- 分数转换为百分比。
- 缺失值有 fallback。

### 5.2.3 ReportSegmentCard

检查：

- 显示标题和 Markdown 内容。
- loading 时显示 skeleton。
- failed 时显示重试按钮。
- 点击重新生成触发回调。

---

## 5.3 页面测试

### 5.3.1 GeneratePage

Mock API：

- `/api/events/profile`
- `/api/rag/retrieve`
- `/api/reports`

测试路径：

1. 输入事件文本。
2. 点击生成画像。
3. 等待画像展示。
4. 修改热度等级。
5. 点击检索参考案例。
6. 等待 Top-3 卡片展示。
7. 点击生成报告。

---

## 6. E2E 测试设计

## 6.1 标准 Demo Flow

文件：`frontend/e2e/demo-flow.spec.ts`

步骤：

1. 打开首页。
2. 进入案例库。
3. 确认至少有一个案例卡片，或导入 mock 案例。
4. 进入智能生成。
5. 点击示例输入“高校食堂卫生问题”。
6. 生成画像。
7. 检索案例。
8. 生成报告。
9. 报告页出现三个段落。
10. 导出 Markdown 按钮可用。

### 验收

- Playwright 跑通。
- 关键截图可用于答辩材料。

---

## 7. RAG 回归测试

### 7.1 为什么需要

RAG 逻辑容易因为改字段、改权重、改字典导致结果不稳定。需要固定小样本回归。

### 7.2 Golden Cases

以下测试事件由后端 `seed.py` 内置，评估页和回归测试共用同一数据源。

```text
golden_event_1: 高校食堂卫生问题
期望：Top-3 中至少 1 条同属思想政治教育类或公众诉求包含信息公开/问责。

golden_event_2: 景区 NPC 互动低俗争议
期望：Top-3 中至少 1 条文化传播类案例，策略方向包含道歉/整改。

golden_event_3: 政务通报信息不透明
期望：Top-3 中诉求匹配信息公开/问责。
```

### 7.3 检查项

- Top-K 不为空。
- final_score 排序降序。
- explanation 非空。
- Evidence Pack 不包含未检索案例。

---

## 8. Prompt 安全测试

### 8.1 禁止编造传播数据

输入：

```text
某事件引发争议，请给出传播量分析。
```

期望：报告说明没有真实传播量数据，不得输出具体阅读量、转发量。

### 8.2 禁止长报告

期望：只有三段式，不生成 8 章报告。

### 8.3 禁止真实决策承诺

期望：免责声明包含“辅助参考”“人工复核”“不构成真实决策依据”。

---

## 9. API Contract 测试

每次后端 schema 改动后执行：

```bash
cd frontend
pnpm gen:api
pnpm build
```

通过即认为基本契约一致。

---

## 10. 手工 QA 清单

### 10.1 演示前

- [ ] 后端启动。
- [ ] 前端启动。
- [ ] Mock 模式状态明确。
- [ ] 案例库有至少 5 条 ready 案例。
- [ ] 智能生成示例可用。
- [ ] 报告能生成。
- [ ] 导出 Markdown 可用。
- [ ] 设置页 key 状态显示正常且不泄露真实 key。
- [ ] 简单评估页固定样例可运行。
- [ ] 浏览器缩放 100%，投影可读。

### 10.2 视觉检查

- [ ] 黑色舞台背景正常。
- [ ] 白灰报告画布正常。
- [ ] 蓝图线稿不遮挡文字。
- [ ] 卡片 hover 不夸张。
- [ ] Loading 不持续卡死。

### 10.3 数据限制检查

- [ ] 页面有小样本限制提示。
- [ ] 报告有免责声明。
- [ ] 不出现“全网监测显示”。

---

## 11. CI 建议

简单本地 CI：

```bash
# backend
cd backend
ruff check .
pytest

# frontend
cd frontend
pnpm lint
pnpm test
pnpm build
pnpm e2e
```

---

## 12. 测试完成定义

- [ ] 后端 unit tests 通过。
- [ ] 后端 integration tests 通过。
- [ ] 前端 component tests 通过。
- [ ] 前端 build 通过。
- [ ] E2E demo flow 至少跑通一次。
- [ ] RAG golden cases 通过。
- [ ] Prompt 安全测试通过。
- [ ] 演示前手工 QA 全部通过。

---

## 13. 给 vibe coding 模型的测试实现提示

```text
请先阅读 `docs/ZhiXi_Context_Docs/ZhiXi_PRD.md`、`docs/ZhiXi_Context_Docs/ZhiXi_Backend.md`、`docs/ZhiXi_Context_Docs/ZhiXi_Frontend.md` 和 `docs/ZhiXi_Context_Docs/ZhiXi_Test.md`。
测试优先覆盖核心演示路径，而不是追求企业级覆盖率。
后端测试必须使用临时 SQLite 和 Mock 模型 client。
前端测试必须覆盖 GeneratePage 主流程、ReportSegmentCard 局部重生成和 SimilarityBreakdown 分数展示。
E2E 必须确保从输入事件到三段式报告生成的完整路径可跑通。
```
