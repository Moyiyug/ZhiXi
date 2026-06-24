# ZhiXi_Backend.md

> 文档版本：v0.2  
> 对应 PRD：`ZhiXi_PRD.md`  
> 对应前端规范：`ZhiXi_Frontend.md`  
> 后端目标：基于 FastAPI + SQLite 实现案例库、RAG 检索、Evidence Pack、三段式报告生成和 Mock 演示能力。

---

## 0. Backend Skill Reference

以下“技能上下文”用于指导 vibe coding 模型拆分后端任务。它们不是必须安装的插件，而是开发角色说明。

### 0.1 `zhi_xi_fastapi_contract_builder`

**用途**：定义 FastAPI 路由、Pydantic/SQLModel schema、OpenAPI 契约。  
**完成标准**：`/docs` 可访问，前端可用 OpenAPI 生成类型。

### 0.2 `zhi_xi_sqlite_case_store`

**用途**：设计 SQLite 表结构、案例 CRUD、CSV 导入、FTS5 可选全文检索。  
**完成标准**：本地无需复杂数据库即可运行。

### 0.3 `zhi_xi_rag_pipeline_engineer`

**用途**：实现标准化 query 构造、embedding、向量召回、加权重排、Evidence Pack。  
**完成标准**：检索结果包含可解释分数拆解。

### 0.4 `zhi_xi_prompt_segment_writer`

**用途**：维护三段式报告 Prompt，保证每段单独调用大模型。  
**完成标准**：第一段分析与案例、第二段结论与话术、第三段免责声明。

### 0.5 `zhi_xi_mock_mode_guard`

**用途**：保证无外部 API Key 时也能演示。  
**完成标准**：Embedding、Profile、Report 都有 deterministic mock fallback。

### 0.6 `zhi_xi_backend_test_designer`

**用途**：为 SQLite、RAG、Prompt、API 编写 pytest 测试。  
**完成标准**：核心接口和检索公式可测试。

---

## 1. 后端技术栈

### 1.1 推荐栈

```text
Python 3.11+
FastAPI
Pydantic v2
SQLModel（首选；必要时可直接使用 SQLAlchemy 2.x）
SQLite
Uvicorn
httpx
numpy
pandas
python-multipart
openai SDK compatible client
pytest
ruff
```

### 1.2 可选栈

```text
LangChain：仅作为可选 adapter，不做核心依赖
SQLite FTS5：用于关键词召回，可选
python-docx：P1 用于 docx 导出
```

### 1.3 调研参考

- FastAPI 自动 OpenAPI/Swagger 文档：`https://fastapi.tiangolo.com/features/`
- FastAPI SQL 数据库教程：`https://fastapi.tiangolo.com/zh/tutorial/sql-databases/`
- SQLModel：`https://sqlmodel.tiangolo.com/`
- SQLite FTS5：`https://sqlite.org/fts5.html`
- LangChain Retrieval：`https://docs.langchain.com/oss/python/langchain/retrieval`
- LangChain Vector Stores：`https://docs.langchain.com/oss/python/integrations/vectorstores`
- 阿里云/千问 text-embedding-v4：`https://www.alibabacloud.com/help/en/model-studio/embedding`
- DeepSeek API：`https://api-docs.deepseek.com/`

---

## 2. 后端架构总览

```text
FastAPI API Layer
  -> Pydantic/SQLModel Schemas
  -> Services
      CaseService
      DictionaryService
      EmbeddingService
      ProfileService
      RetrievalService
      RerankService
      EvidencePackService
      ReportGenerationService
      ExportService
      EvaluationService
  -> SQLite Repositories
  -> External Model Clients
      Qwen/DashScope Embedding Client
      DeepSeek Chat Client
      Mock LLM Client
```

### 2.1 目录结构

```text
backend/
  app/
    main.py
    api/
      health.py
      dashboard.py
      cases.py
      dictionaries.py
      events.py
      rag.py
      reports.py
      settings.py
      evaluation.py
    core/
      config.py
      logging.py
      errors.py
      security.py
    db/
      session.py
      init_db.py
      seed.py
    models/
      case.py
      dictionary.py
      embedding.py
      report.py
      retrieval.py
      setting.py
    schemas/
      case.py
      dictionary.py
      event.py
      rag.py
      report.py
      common.py
    services/
      case_service.py
      csv_import_service.py
      dictionary_service.py
      embedding_service.py
      profile_service.py
      retrieval_service.py
      rerank_service.py
      evidence_pack_service.py
      report_generation_service.py
      export_service.py
      evaluation_service.py
    clients/
      embedding_client.py
      llm_client.py
      mock_client.py
    prompts/
      profile_prompt.py
      report_segments.py
      review_prompt.py
    utils/
      vectors.py
      normalize.py
      text_builders.py
  scripts/
    import_csv.py
    rebuild_embeddings.py
  tests/
    unit/
    integration/
  pyproject.toml
  .env.example
```

---

## 3. SQLite 数据库设计

### 3.1 为什么默认 SQLite

- 项目是课程演示原型，数据量很小。
- 本地启动简单，便于交付和答辩。
- 不需要部署 Postgres/pgvector。
- 向量可以存 JSON 或 BLOB，在 Python 内计算 cosine similarity。
- 后续如数据增大，可迁移到 pgvector/Qdrant。

### 3.2 表结构概览

| 表 | 用途 |
|---|---|
| `cases` | 舆情案例主体 |
| `case_embeddings` | 案例 embedding 文本与向量 |
| `background_dict_items` | 背景判断字典 |
| `retrieval_runs` | 检索日志 |
| `retrieval_results` | 单次检索的 Top-K 结果 |
| `reports` | 报告主体 |
| `report_segments` | 三段式报告段落 |
| `llm_call_logs` | LLM 调用日志 |
| `app_settings` | 公开设置和 mock 状态 |

### 3.3 Case 模型示例

```python
from datetime import datetime
from typing import Optional
from sqlmodel import SQLModel, Field

class Case(SQLModel, table=True):
    __tablename__ = "cases"

    id: Optional[int] = Field(default=None, primary_key=True)
    case_code: Optional[str] = Field(default=None, index=True)
    title: str = Field(index=True)
    domain: str = Field(index=True)
    public_demands_json: str = Field(default="[]")
    heat_level: int = Field(default=3, index=True)
    response_speed: Optional[str] = None
    effect_score: Optional[int] = Field(default=None)
    strategy_types_json: str = Field(default="[]")
    event_description: str
    strategy_text: str
    vertical_subject: Optional[str] = None
    carrier_target: Optional[str] = None
    trigger_reason: Optional[str] = None
    risk_tags_json: str = Field(default="[]")
    notes: Optional[str] = None
    enabled: bool = Field(default=True, index=True)
    embedding_status: str = Field(default="none", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

### 3.4 CaseEmbedding 模型

```python
class CaseEmbedding(SQLModel, table=True):
    __tablename__ = "case_embeddings"

    id: Optional[int] = Field(default=None, primary_key=True)
    case_id: int = Field(index=True, foreign_key="cases.id")
    embedding_text: str
    embedding_json: str  # JSON list[float]
    model_name: str
    dimensions: int
    created_at: datetime = Field(default_factory=datetime.utcnow)
```

### 3.5 Report 模型

```python
class Report(SQLModel, table=True):
    __tablename__ = "reports"

    id: Optional[int] = Field(default=None, primary_key=True)
    input_event_text: str
    profile_json: str
    evidence_pack_json: str
    status: str = Field(default="draft", index=True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class ReportSegment(SQLModel, table=True):
    __tablename__ = "report_segments"

    id: Optional[int] = Field(default=None, primary_key=True)
    report_id: int = Field(index=True, foreign_key="reports.id")
    segment_key: str = Field(index=True)
    title: str
    content_md: str = ""
    model_name: Optional[str] = None
    generation_status: str = "pending"
    regenerated_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
```

---

## 4. 配置设计

### 4.1 `.env.example`

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

### 4.2 配置原则

- API Key 只在后端环境变量中。
- 前端只能看到“已配置/未配置”。
- Mock 模式优先支持演示。
- 模型名可配置，避免未来模型 ID 变化导致代码大改。

---

## 5. API 设计

## 5.1 Health

### `GET /api/health`

返回：

```json
{
  "status": "ok",
  "mock_mode": true,
  "database": "ok"
}
```

---

## 5.2 Dashboard

### `GET /api/dashboard/summary`

返回：

```json
{
  "case_total": 40,
  "case_enabled": 30,
  "embedding_ready": 30,
  "report_total": 5,
  "mock_mode": true
}
```

---

## 5.3 Cases

### `GET /api/cases`

Query 参数：

- `q?: string`
- `domain?: string`
- `enabled?: boolean`
- `embedding_status?: string`
- `page?: int`
- `page_size?: int`

返回：分页案例列表。

### `POST /api/cases`

创建案例。

### `GET /api/cases/{case_id}`

获取详情。

### `PUT /api/cases/{case_id}`

更新案例。更新后需要把 `embedding_status` 置为 `none` 或提示重新生成。

### `DELETE /api/cases/{case_id}`

硬删除案例。前端需二次确认。删除时同时删除关联的 `case_embeddings` 记录。

### `POST /api/cases/import-csv`

上传 CSV，返回导入结果：

```json
{
  "imported": 40,
  "skipped": 0,
  "errors": []
}
```

### `POST /api/cases/{case_id}/embedding`

为单条案例生成 embedding。

### `POST /api/cases/rebuild-embeddings`

批量重建 embedding。

### `POST /api/cases/{case_id}/toggle`

启用/停用案例。

---

## 5.4 Dictionaries

### `GET /api/dictionaries`

返回所有默认背景判断字典。

---

## 5.5 Event Profile

### `POST /api/events/profile`

请求：

```json
{
  "event_text": "某高校食堂被曝食品卫生问题...",
  "manual_hints": {
    "domain": "思想政治教育类",
    "heat_level": 4
  }
}
```

返回：

```json
{
  "event_summary": "高校食堂卫生问题引发学生集中讨论",
  "domain": "思想政治教育类",
  "public_demands": ["要求信息公开", "要求问责"],
  "heat_level": 4,
  "risk_keywords": ["高校", "学生群体", "食品安全"],
  "inferred_strategy_direction": ["信息公开型", "行动补救型"],
  "confidence": 0.78,
  "profile_source": "mixed"
}
```

---

## 5.6 RAG

### `POST /api/rag/retrieve`

请求：

```json
{
  "event_text": "...",
  "profile": {
    "event_summary": "...",
    "domain": "思想政治教育类",
    "public_demands": ["要求信息公开", "要求问责"],
    "heat_level": 4,
    "risk_keywords": ["高校", "食品安全"]
  },
  "top_k": 3
}
```

返回：

```json
{
  "query_text": "标准化检索文本...",
  "results": [
    {
      "case_id": "1",
      "title": "某高校类似事件",
      "semantic_score": 0.76,
      "demand_score": 1.0,
      "heat_score": 0.75,
      "domain_score": 1.0,
      "effect_score": 0.8,
      "final_score": 0.82,
      "explanation": "同属思想政治教育类，公众诉求集中于信息公开与问责。"
    }
  ]
}
```

### `POST /api/rag/evidence-pack`

根据 profile 和 retrieved results 生成 Evidence Pack。

---

## 5.7 Reports

### `POST /api/reports`

请求：

```json
{
  "input_event_text": "...",
  "profile": { },
  "evidence_pack": { },
  "generate_now": true
}
```

行为：

1. 创建 report。
2. 创建 3 个 segments。
3. 如果 `generate_now=true`，依次生成 3 段。
4. 返回 report id 和 segment 状态。

### `GET /api/reports/{report_id}`

返回完整报告。

### `POST /api/reports/{report_id}/segments/{segment_key}/regenerate`

只重新生成指定段落。

`segment_key` 只能是：

- `analysis_and_cases`
- `strategy_and_speech`
- `disclaimer`

### `GET /api/reports/{report_id}/export.md`

返回 Markdown 文件内容。

---

## 5.8 Settings

### `GET /api/settings/public`

返回前端可展示的公开配置摘要。不得返回任何真实 API Key 或密钥原文。

```json
{
  "mock_mode": true,
  "embedding_model": "text-embedding-v4",
  "llm_model_fast": "deepseek-v4-flash",
  "llm_model_pro": "deepseek-v4-pro",
  "keys": {
    "dashscope": "missing",
    "deepseek": "missing"
  },
  "retrieval": {
    "top_n": 10,
    "top_k": 3,
    "weights": {
      "semantic": 0.45,
      "demand": 0.20,
      "heat": 0.15,
      "domain": 0.10,
      "effect": 0.10
    }
  }
}
```

`keys` 字段只能使用 `configured` / `missing` 这类状态值。

---

## 5.9 Evaluation

### `POST /api/evaluation/run-demo`

运行固定测试事件或用户指定的临时测试事件，返回画像、检索结果和轻量指标。该接口是 P1，用于答辩演示验证意识，不做严格因果评估。

请求：

```json
{
  "demo_event_id": "golden_event_1",
  "event_text": "",
  "top_k": 3
}
```

行为：

1. 若提供 `demo_event_id`，读取内置固定测试事件（由 `seed.py` 在数据库初始化时写入，包含 3-5 条预设舆情事件文本和期望描述）。
2. 若提供 `event_text`，使用该文本临时运行。
3. 生成或复用事件画像。
4. 执行 `/api/rag/retrieve` 同一套检索与重排逻辑。
5. 返回 Top-K、平均参考匹配度、同领域命中和人工评分占位。

返回：

```json
{
  "event_id": "golden_event_1",
  "profile": { },
  "results": [],
  "metrics": {
    "top_k": 3,
    "average_final_score": 0.82,
    "has_same_domain_hit": true
  },
  "manual_score": {
    "relevance": null,
    "actionability": null,
    "risk_control": null,
    "expression_quality": null
  }
}
```

---

## 6. RAG 实现详细设计

## 6.1 案例入库流程

```text
CSV/表单输入
  -> normalize_case_fields
  -> map_domain_and_vertical_fields
  -> use_dictionary_to_build_embedding_text
  -> embedding_client.embed(text)
  -> save CaseEmbedding
  -> mark case.embedding_status = ready
```

### 6.1.1 CSV 清理要求

- 删除 `Unnamed:*` 空列。
- 标准化列名。
- 空字符串转 `None`。
- 从第二层字段推断领域。
- 公众诉求和策略类型按 `,`、`，`、`/` 拆分。
- 热度等级从文本中提取 1-5。
- 处置效果从文本中提取 1-5。

### 6.1.2 Embedding 文本构造

```python
def build_case_embedding_text(case: Case, dictionaries: dict) -> str:
    demand_hints = [dictionaries["public_demands"][d].meaning for d in case.public_demands]
    heat_hint = dictionaries["heat_levels"][str(case.heat_level)].meaning
    strategy_hints = [dictionaries["strategy_types"][s].meaning for s in case.strategy_types]

    return f"""
案例名称：{case.title}
所属领域：{case.domain}
公众诉求：{'、'.join(case.public_demands)}。{'；'.join(demand_hints)}
热度等级：{case.heat_level}。{heat_hint}
策略类型：{'、'.join(case.strategy_types)}。{'；'.join(strategy_hints)}
事件描述：{case.event_description}
核心处置策略：{case.strategy_text}
处置效果：{case.effect_score or '未知'}
""".strip()
```

---

## 6.2 当前事件画像

### 6.2.1 实现方式

优先：LLM 提取 + 字典约束。  
fallback：规则提取。

### 6.2.2 Prompt 约束

- 必须输出 JSON。
- 领域只能从枚举中选。
- 公众诉求只能从字典中选。
- 热度等级必须 1-5。
- 不得编造外部数据。

### 6.2.3 Mock 画像

无 API Key 时：

- 根据关键词匹配领域。
- 根据”问责/公开/道歉/赔偿”等词匹配诉求。
- 默认热度 3，包含”热搜/大量转发/爆”则升为 4 或 5。
- `confidence` 固定返回 0.70–0.85 之间的启发式值。

---

## 6.3 Query Text 构造

```python
def build_query_text(event_text: str, profile: EventProfile, dictionaries: dict) -> str:
    demand_lines = []
    for demand in profile.public_demands:
        item = dictionaries["public_demands"].get(demand)
        if item:
            demand_lines.append(f"{demand}表示{item['meaning']}")

    heat_item = dictionaries["heat_levels"].get(str(profile.heat_level))

    return f"""
当前事件：{event_text}
事件摘要：{profile.event_summary}
所属领域：{profile.domain}
公众诉求：{'、'.join(profile.public_demands)}。{'；'.join(demand_lines)}
热度等级：{profile.heat_level}，{heat_item['meaning'] if heat_item else ''}
风险关键词：{'、'.join(profile.risk_keywords)}
检索目标：寻找相似历史案例及可借鉴处置策略。
""".strip()
```

---

## 6.4 向量召回

### 6.4.1 默认实现

由于 SQLite 不提供原生向量检索，默认做法：

1. 从 SQLite 查询所有 enabled + ready embedding。
2. JSON 解析为 `numpy.ndarray`。
3. 计算 cosine similarity。
4. 排序取 Top-N。

对于几十条案例，这种方式足够快，且最易演示。

### 6.4.2 cosine similarity

```python
import numpy as np

def cosine_similarity(a: list[float], b: list[float]) -> float:
    va = np.asarray(a, dtype=np.float32)
    vb = np.asarray(b, dtype=np.float32)
    denom = float(np.linalg.norm(va) * np.linalg.norm(vb))
    if denom == 0:
        return 0.0
    raw = float(np.dot(va, vb) / denom)
    return max(0.0, min(1.0, (raw + 1.0) / 2.0))
```

### 6.4.3 可选 FTS5

SQLite FTS5 可作为关键词召回补充，但不是 P0 必需。可在 V0.3 中实现：

```text
候选集 = 向量召回 Top-N ∪ FTS5 关键词召回 Top-M
再统一加权重排
```

---

## 6.5 加权重排

```python
def demand_score(query_demands: list[str], case_demands: list[str]) -> float:
    if not query_demands or not case_demands:
        return 0.5
    q, c = set(query_demands), set(case_demands)
    return len(q & c) / len(q | c)


def heat_score(query_heat: int, case_heat: int) -> float:
    return max(0.0, 1.0 - abs(query_heat - case_heat) / 4.0)


def domain_score(query_domain: str, case_domain: str, domain_relations: dict) -> float:
    if query_domain == case_domain:
        return 1.0
    # 查字典关系矩阵，未定义的关系默认 0.0
    related = domain_relations.get(query_domain, {})
    return related.get(case_domain, 0.0)


def effect_score(effect: int | None) -> float:
    if effect is None:
        return 0.6
    return max(0.0, min(1.0, effect / 5.0))


def final_score(scores: dict, weights: dict) -> float:
    return round(
        scores["semantic"] * weights["semantic"] +
        scores["demand"] * weights["demand"] +
        scores["heat"] * weights["heat"] +
        scores["domain"] * weights["domain"] +
        scores["effect"] * weights["effect"],
        4,
    )
```

---

## 6.6 Evidence Pack 生成

```python
def build_evidence_pack(event_text, profile, retrieved_cases, dictionaries):
    return {
        "current_event": profile.model_dump(),
        "query_text": build_query_text(event_text, profile, dictionaries),
        "retrieved_cases": [
            {
                "title": item.title,
                "domain": item.domain,
                "event_description": item.event_description[:240],
                "strategy_text": item.strategy_text[:240],
                "final_score": item.final_score,
                "explanation": item.explanation,
            }
            for item in retrieved_cases
        ],
        "dictionary_hints": extract_relevant_hints(profile, dictionaries),
        "limitations": [
            "当前案例库为课程项目小样本案例库。",
            "检索结果仅表示参考匹配度，不代表真实策略有效性。",
            "报告不得虚构全网传播数据、热搜排名或真实处置结论。",
        ],
    }
```

---

## 6.7 报告生成

### 6.7.1 三个 Prompt

#### 第一段 Prompt：`analysis_and_cases`

目标：舆情画像与历史案例参考。

约束：

- 只基于 Evidence Pack。
- 不编造传播数据。
- 不写过长。
- 合并当前分析和历史案例。

#### 第二段 Prompt：`strategy_and_speech`

目标：处置结论与回应话术。

约束：

- 给出可执行建议。
- 至少一段回应话术。
- 不承诺未调查清楚的事实。
- 避免官腔空话。

#### 第三段 Prompt：`disclaimer`

目标：免责声明。

约束：

- 80-180 字。
- 明确小样本、模型、人工复核。

### 6.7.2 调用顺序

```python
segments = [
    "analysis_and_cases",
    "strategy_and_speech",
    "disclaimer",
]
for key in segments:
    content = report_generation_service.generate_segment(key, evidence_pack)
    save_segment(report_id, key, content)
```

### 6.7.3 Mock 生成

无 API Key 或 `APP_MOCK_MODE=true` 时使用模板生成，例如：

```text
一、舆情画像与历史案例参考
该事件初步可归为{domain}，主要诉求集中在{public_demands}。参考案例显示，类似事件中较有效的处理方式通常包括{strategy_types}。由于当前案例库规模有限，以下判断仅作为原型演示参考。
```

---

## 7. LangChain 接入分析

### 7.1 结论

**支持接入，但不建议作为核心架构强依赖。**

本项目数据是结构化案例表，不是大量 PDF/网页文档。核心竞争力在：

- 背景判断字典。
- 字段标准化。
- 小样本弱过滤。
- 加权重排。
- Evidence Pack。
- 分段报告生成。

这些逻辑应保留在自研 services 中。

### 7.2 LangChain 可用位置

| 位置 | 是否建议 | 说明 |
|---|---|---|
| Document 抽象 | 可选 | 把 CaseEmbedding 封装成 Document |
| VectorStore | 可选 | 如果以后接 Chroma/FAISS/Qdrant |
| PromptTemplate | 可选 | 维护 Prompt 模板 |
| Retriever | 可选 | 封装向量召回 |
| Agent | 不建议 | 对演示目标过重 |
| LangGraph | 不建议 | 当前流程固定，无需图编排 |

### 7.3 Adapter 设计

```text
RetrievalService
  -> BaseRetrieverAdapter
      -> LocalSQLiteVectorAdapter  默认
      -> LangChainVectorStoreAdapter  可选
```

接口：

```python
class BaseRetrieverAdapter:
    def add_case(self, case_id: int, text: str, embedding: list[float], metadata: dict): ...
    def similarity_search(self, query_embedding: list[float], top_n: int) -> list[Candidate]: ...
```

这样未来接 LangChain 不影响 API 和业务逻辑。

---

## 8. 前后端对接原则

1. 后端字段使用 snake_case。
2. 前端通过 OpenAPI 生成类型，必要时在 UI 层转换显示名。
3. 所有时间使用 ISO 字符串。
4. 所有分数使用 0-1 float，前端展示成百分比。
5. API 返回错误格式统一：

```json
{
  "detail": "错误说明",
  "code": "CASE_NOT_FOUND"
}
```

6. 后端不返回真实 API Key。
7. 长任务演示版可以同步执行；如果后续慢，再改异步任务。

---

## 9. 错误处理

| 场景 | 后端行为 |
|---|---|
| 案例不存在 | 404 |
| 表单字段错误 | 422 |
| API Key 缺失 | 若 mock_mode=true，走 mock；否则 500 + 明确提示 |
| embedding 失败 | 标记 `embedding_status=failed` |
| 检索无结果 | 返回空数组 + limitations |
| 报告生成失败 | segment 标记 failed，可单段重试 |

---

## 10. 后端验收清单

- [ ] FastAPI 可启动。
- [ ] `/docs` 可访问。
- [ ] SQLite 自动建表。
- [ ] 字典 seed 成功。
- [ ] CSV 导入可用并清理空列。
- [ ] 案例 CRUD 可用。
- [ ] embedding 生成可用或 mock 可用。
- [ ] RAG 检索返回 Top-K 和分数拆解。
- [ ] Evidence Pack 可单独生成。
- [ ] 报告按三段生成。
- [ ] 每段可局部重生成。
- [ ] Markdown 导出可用。
- [ ] `GET /api/settings/public` 只返回公开配置和 key 状态。
- [ ] `POST /api/evaluation/run-demo` 可运行固定样例并返回轻量指标。
- [ ] 无 API Key 时可演示。
- [ ] pytest 核心测试通过。

---

## 11. 给 vibe coding 模型的后端实现提示

```text
请先阅读 `docs/ZhiXi_Context_Docs/ZhiXi_PRD.md` 和 `docs/ZhiXi_Context_Docs/ZhiXi_Backend.md`。
后端必须使用 FastAPI + SQLite，优先实现可演示闭环。
不要引入 Postgres/pgvector 作为必需依赖。
不要把 LangChain 作为核心架构，只能作为可选 adapter。
所有模型调用都必须有 Mock fallback。
RAG 流程必须是：画像 -> query_text -> embedding -> 向量召回 -> 加权重排 -> Evidence Pack -> 三段式报告。
报告必须分段调用，不能一次性生成完整长报告。
```
