# ZhiXi_DevPlan.md

> 文档版本：v0.3
> 目标：把 PRD、前端、后端、技术、测试文档转化为可逐文件执行开发计划。
> 原则：先闭环，后美化；先 Mock，后真实模型；先 P0，后 P1。

---

## 1. 开发总路线

```text
阶段 0：Git 初始化 + .gitignore
阶段 1：后端 schemas + API 路由（health/dashboard/cases/dictionaries/embeddings）
阶段 2：后端 services（case/csv_import/dictionary/embedding）
阶段 3：后端 RAG 管线（profile → retrieve → rerank → evidence_pack → report）
阶段 4：前端 AppShell + 视觉系统
阶段 5：前端案例库 UI
阶段 6：前端智能生成 UI
阶段 7：前端报告页 UI
阶段 8：前端设置页 + 评估页 + 工作台
阶段 9：脚本 + 测试
阶段 10：演示打磨
```

---

## 2. 阶段 0：Git 初始化 + 根 .gitignore

### 2.1 目标

完成仓库初始化，保护敏感文件不被提交。

### 2.2 文件清单

| 文件 | 操作 | 说明 |
|---|---|---|
| `./.gitignore` | 创建 | 根级 ignore 规则 |
| Git commit | 执行 | 首次提交 |

### 2.3 `./.gitignore` 内容

```gitignore
# Python
__pycache__/
*.py[cod]
*.egg-info/
dist/
.ruff_cache/
.pytest_cache/
.venv/

# Node
node_modules/
.pnpm-store/

# Environment
.env
.env.*
!.env.example

# Database
data/*.db
data/*.sqlite*

# IDE
.vscode/*
!.vscode/extensions.json
.idea/
*.swp
*.suo

# OS
.DS_Store
Thumbs.db
Desktop.ini

# Build
dist-ssr/
*.local

# Logs
logs/
*.log
```

### 2.4 验收

- [ ] `git check-ignore .env` → `.env`
- [ ] `git check-ignore node_modules` → `node_modules`
- [ ] `git check-ignore __pycache__` → `__pycache__`
- [ ] `git commit` → 初始提交成功，`git log --oneline` 显示 1 次 commit
- [ ] `git status --porcelain` 为空

---

## 3. 阶段 1：后端 schemas + API 路由

### 3.1 目标

定义所有 Pydantic v2 schema，创建全部 API 路由骨架。本阶段不写业务逻辑（services 留到阶段 2/3），API 端点返回 mock 数据或占位响应。

### 3.2 文件清单

#### 3.2.1 Schemas（7 文件）

**`backend/app/schemas/common.py`**

```python
from pydantic import BaseModel

class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int

class ImportResult(BaseModel):
    imported: int
    skipped: int
    errors: list[str]
```

**`backend/app/schemas/case.py`**

```python
from datetime import datetime
from pydantic import BaseModel, Field

class CaseCreate(BaseModel):
    case_code: str | None = None
    title: str = Field(..., min_length=1)
    domain: str
    public_demands: list[str] = Field(default_factory=list)
    heat_level: int = Field(default=3, ge=1, le=5)
    response_speed: str | None = None
    effect_score: int | None = Field(default=None, ge=1, le=5)
    strategy_types: list[str] = Field(default_factory=list)
    event_description: str = ""
    strategy_text: str = ""
    vertical_subject: str | None = None
    carrier_target: str | None = None
    trigger_reason: str | None = None
    risk_tags: list[str] = Field(default_factory=list)
    notes: str | None = None

class CaseUpdate(BaseModel):
    title: str | None = None
    domain: str | None = None
    public_demands: list[str] | None = None
    heat_level: int | None = Field(default=None, ge=1, le=5)
    response_speed: str | None = None
    effect_score: int | None = Field(default=None, ge=1, le=5)
    strategy_types: list[str] | None = None
    event_description: str | None = None
    strategy_text: str | None = None
    vertical_subject: str | None = None
    carrier_target: str | None = None
    trigger_reason: str | None = None
    risk_tags: list[str] | None = None
    notes: str | None = None

class CaseResponse(BaseModel):
    id: int
    case_code: str | None
    title: str
    domain: str
    public_demands: list[str]
    heat_level: int
    response_speed: str | None
    effect_score: int | None
    strategy_types: list[str]
    event_description: str
    strategy_text: str
    vertical_subject: str | None
    carrier_target: str | None
    trigger_reason: str | None
    risk_tags: list[str]
    notes: str | None
    enabled: bool
    embedding_status: str
    created_at: datetime
    updated_at: datetime

class CaseListResponse(PaginatedResponse):
    items: list[CaseResponse]

class CaseSummary(BaseModel):
    id: int
    title: str
    domain: str
    heat_level: int
    effect_score: int | None
    enabled: bool
    embedding_status: str
```

**`backend/app/schemas/dictionary.py`**

```python
from pydantic import BaseModel

class DictItemResponse(BaseModel):
    key: str
    label: str
    meaning: str
    report_hint: str
    speech_hint: str
    risk_hint: str
    domain_relations: dict[str, float] | None = None

class DictionaryResponse(BaseModel):
    public_demands: list[DictItemResponse]
    heat_levels: list[DictItemResponse]
    strategy_types: list[DictItemResponse]
    domain_labels: list[DictItemResponse]
    domain_relations: list[DictItemResponse]
```

**`backend/app/schemas/event.py`**

```python
from pydantic import BaseModel, Field

class ManualHints(BaseModel):
    domain: str | None = None
    heat_level: int | None = Field(default=None, ge=1, le=5)
    public_demands: list[str] | None = None

class ProfileRequest(BaseModel):
    event_text: str = Field(..., min_length=50, max_length=800)
    manual_hints: ManualHints | None = None

class CurrentEventProfile(BaseModel):
    event_summary: str
    domain: str
    public_demands: list[str]
    heat_level: int = Field(ge=1, le=5)
    risk_keywords: list[str]
    platforms: list[str] = Field(default_factory=list)
    inferred_strategy_direction: list[str] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)
    profile_source: str  # 'llm' | 'rule' | 'manual' | 'mixed'
```

**`backend/app/schemas/rag.py`**

```python
from pydantic import BaseModel, Field

class RetrieveRequest(BaseModel):
    event_text: str = Field(..., min_length=50, max_length=800)
    profile: CurrentEventProfile
    top_k: int = Field(default=3, ge=1, le=10)

class RetrievedCaseItem(BaseModel):
    case_id: int
    title: str
    domain: str
    event_description: str
    strategy_text: str
    semantic_score: float
    demand_score: float
    heat_score: float
    domain_score: float
    effect_score: float
    final_score: float
    explanation: str

class RetrieveResponse(BaseModel):
    query_text: str
    results: list[RetrievedCaseItem]

class EvidencePackResponse(BaseModel):
    current_event: CurrentEventProfile
    query_text: str
    retrieved_cases: list[RetrievedCaseItem]
    dictionary_hints: dict
    limitations: list[str]
```

**`backend/app/schemas/report.py`**

```python
from datetime import datetime
from pydantic import BaseModel, Field

class ReportCreateRequest(BaseModel):
    input_event_text: str
    profile: CurrentEventProfile
    evidence_pack: EvidencePackResponse
    generate_now: bool = True

class ReportSegmentResponse(BaseModel):
    id: int
    report_id: int
    segment_key: str  # analysis_and_cases | strategy_and_speech | disclaimer
    title: str
    content_md: str
    model_name: str | None
    generation_status: str  # pending | generating | ready | failed
    regenerated_count: int
    created_at: datetime
    updated_at: datetime

class ReportResponse(BaseModel):
    id: int
    input_event_text: str
    profile: CurrentEventProfile
    evidence_pack: EvidencePackResponse
    status: str
    segments: list[ReportSegmentResponse]
    created_at: datetime
    updated_at: datetime
```

#### 3.2.2 API 路由（8 文件）

**`backend/app/api/dashboard.py`**

```python
from fastapi import APIRouter, Depends
from sqlmodel import Session, func
from app.db.session import get_session
from app.core.config import settings
from app.models.case import Case
from app.models.report import Report

router = APIRouter(prefix="/api", tags=["dashboard"])

@router.get("/dashboard/summary")
def get_summary(session: Session = Depends(get_session)):
    case_total = session.exec(func.count(Case.id)).one()
    case_enabled = session.exec(func.count(Case.id)).where(Case.enabled == True).one()
    embedding_ready = session.exec(func.count(Case.id)).where(Case.embedding_status == "ready").one()
    report_total = session.exec(func.count(Report.id)).one()
    return {
        "case_total": case_total,
        "case_enabled": case_enabled,
        "embedding_ready": embedding_ready,
        "report_total": report_total,
        "mock_mode": settings.app_mock_mode,
    }
```

**`backend/app/api/cases.py`**

```python
from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlmodel import Session
from app.db.session import get_session
from app.schemas.case import CaseCreate, CaseUpdate, CaseResponse, CaseListResponse
from app.schemas.common import ImportResult

router = APIRouter(prefix="/api", tags=["cases"])

@router.get("/cases")
def list_cases(
    q: str | None = Query(default=None),
    domain: str | None = Query(default=None),
    enabled: bool | None = Query(default=None),
    embedding_status: str | None = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    session: Session = Depends(get_session),
) -> CaseListResponse: ...

@router.post("/cases", status_code=201)
def create_case(body: CaseCreate, session: Session = Depends(get_session)) -> CaseResponse: ...

@router.get("/cases/{case_id}")
def get_case(case_id: int, session: Session = Depends(get_session)) -> CaseResponse: ...

@router.put("/cases/{case_id}")
def update_case(case_id: int, body: CaseUpdate, session: Session = Depends(get_session)) -> CaseResponse: ...

@router.delete("/cases/{case_id}", status_code=204)
def delete_case(case_id: int, session: Session = Depends(get_session)) -> None: ...

@router.post("/cases/import-csv")
def import_csv(file: UploadFile = File(...), session: Session = Depends(get_session)) -> ImportResult: ...

@router.post("/cases/{case_id}/toggle")
def toggle_case(case_id: int, session: Session = Depends(get_session)) -> CaseResponse: ...
```

**`backend/app/api/dictionaries.py`**

```python
from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.db.session import get_session
from app.schemas.dictionary import DictionaryResponse

router = APIRouter(prefix="/api", tags=["dictionaries"])

@router.get("/dictionaries")
def get_dictionaries(session: Session = Depends(get_session)) -> DictionaryResponse: ...
```

**`backend/app/api/embeddings.py`**

```python
from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.db.session import get_session

router = APIRouter(prefix="/api", tags=["embeddings"])

@router.post("/cases/{case_id}/embedding")
def generate_embedding(case_id: int, session: Session = Depends(get_session)) -> dict: ...

@router.post("/cases/rebuild-embeddings")
def rebuild_embeddings(session: Session = Depends(get_session)) -> dict: ...
```

**`backend/app/api/events.py`**

```python
from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.db.session import get_session
from app.schemas.event import ProfileRequest, CurrentEventProfile

router = APIRouter(prefix="/api", tags=["events"])

@router.post("/events/profile")
def generate_profile(body: ProfileRequest, session: Session = Depends(get_session)) -> CurrentEventProfile: ...
```

**`backend/app/api/rag.py`**

```python
from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.db.session import get_session
from app.schemas.rag import RetrieveRequest, RetrieveResponse, EvidencePackResponse

router = APIRouter(prefix="/api", tags=["rag"])

@router.post("/rag/retrieve")
def retrieve(body: RetrieveRequest, session: Session = Depends(get_session)) -> RetrieveResponse: ...

@router.post("/rag/evidence-pack")
def build_evidence_pack(body: RetrieveRequest, session: Session = Depends(get_session)) -> EvidencePackResponse: ...
```

**`backend/app/api/reports.py`**

```python
from fastapi import APIRouter, Depends
from fastapi.responses import PlainTextResponse
from sqlmodel import Session
from app.db.session import get_session
from app.schemas.report import ReportCreateRequest, ReportResponse

router = APIRouter(prefix="/api", tags=["reports"])

@router.post("/reports", status_code=201)
def create_report(body: ReportCreateRequest, session: Session = Depends(get_session)) -> ReportResponse: ...

@router.get("/reports/{report_id}")
def get_report(report_id: int, session: Session = Depends(get_session)) -> ReportResponse: ...

@router.post("/reports/{report_id}/segments/{segment_key}/regenerate")
def regenerate_segment(report_id: int, segment_key: str, session: Session = Depends(get_session)) -> ReportResponse: ...

@router.get("/reports/{report_id}/export.md")
def export_report_md(report_id: int, session: Session = Depends(get_session)) -> PlainTextResponse: ...
```

**`backend/app/api/settings.py`**

```python
from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/api", tags=["settings"])

@router.get("/settings/public")
def get_public_settings() -> dict:
    return {
        "mock_mode": settings.app_mock_mode,
        "embedding_model": settings.qwen_embedding_model,
        "llm_model_fast": settings.deepseek_model_fast,
        "llm_model_pro": settings.deepseek_model_pro,
        "keys": {
            "dashscope": "configured" if settings.dashscope_api_key else "missing",
            "deepseek": "configured" if settings.deepseek_api_key else "missing",
        },
        "retrieval": {
            "top_n": settings.retrieval_top_n,
            "top_k": settings.retrieval_top_k,
            "weights": {
                "semantic": settings.weight_semantic,
                "demand": settings.weight_demand,
                "heat": settings.weight_heat,
                "domain": settings.weight_domain,
                "effect": settings.weight_effect,
            },
        },
    }
```

**`backend/app/api/evaluation.py`**

```python
from fastapi import APIRouter, Depends
from sqlmodel import Session
from app.db.session import get_session

router = APIRouter(prefix="/api", tags=["evaluation"])

@router.post("/evaluation/run-demo")
def run_demo_evaluation(demo_event_id: str | None = None, event_text: str | None = None, top_k: int = 3, session: Session = Depends(get_session)) -> dict: ...
```

### 3.3 main.py 注册所有路由

```python
# 在 app/main.py 中追加
from app.api import dashboard, cases, dictionaries, embeddings, events, rag, reports, settings, evaluation

app.include_router(dashboard.router)
app.include_router(cases.router)
app.include_router(dictionaries.router)
app.include_router(embeddings.router)
app.include_router(events.router)
app.include_router(rag.router)
app.include_router(reports.router)
app.include_router(settings.router)
app.include_router(evaluation.router)
```

### 3.4 验收

- [ ] `/docs` Swagger 列出 14+ 端点（含所有标签）
- [ ] `GET /api/settings/public` 返回 200 + key 状态不含真实密钥
- [ ] `ruff check .` 通过
- [ ] `uvicorn app.main:app` 启动无报错

---

## 4. 阶段 2：后端 services（案例 + 字典 + embedding + CSV 导入）

### 4.1 目标

实现数据层的业务逻辑。所有 services 可独立测试。

### 4.2 工具函数（3 文件）

**`backend/app/utils/vectors.py`**

```python
import numpy as np

def cosine_similarity(a: list[float], b: list[float]) -> float:
    """返回归一化到 [0, 1] 的余弦相似度"""
    va = np.asarray(a, dtype=np.float32)
    vb = np.asarray(b, dtype=np.float32)
    denom = float(np.linalg.norm(va) * np.linalg.norm(vb))
    if denom == 0:
        return 0.0
    raw = float(np.dot(va, vb) / denom)
    return max(0.0, min(1.0, (raw + 1.0) / 2.0))
```

**`backend/app/utils/normalize.py`**

```python
import re

def normalize_case_row(row: dict) -> dict:
    """清洗单行 CSV 数据：nan→None, 空串→None, 提取热度数字"""
    for k, v in row.items():
        if isinstance(v, float) and pd.isna(v):
            row[k] = None
        elif v == "" or v == "nan":
            row[k] = None
    if row.get("heat_level_text"):
        m = re.search(r'(\d+)', str(row["heat_level_text"]))
        if m:
            row["heat_level"] = int(m.group(1))
    if row.get("effect_score_text"):
        m = re.search(r'(\d+)', str(row["effect_score_text"]))
        if m:
            row["effect_score"] = int(m.group(1))
    return row

def split_comma_field(value: str | None) -> list[str]:
    """将逗号/顿号/斜杠分隔的文本拆分为数组"""
    if not value:
        return []
    return [s.strip() for s in re.split(r'[,，、/]', value) if s.strip()]

def extract_domain_from_row(row: dict) -> str:
    """根据第二层列是否有数据推断领域"""
    layer2_prefixes = {
        "文化传播类": "【第二层：文化传播类】",
        "思想政治教育类": "【第二层：思想政治教育类】",
        "政府管理类": "【第二层：政府管理类】",
        "技术分析类": "【第二层：技术分析类】",
    }
    for domain, prefix in layer2_prefixes.items():
        cols = [k for k in row if k.startswith(prefix) and row[k] is not None]
        if cols:
            return domain
    return "其他"
```

**`backend/app/utils/text_builders.py`**

```python
def build_case_embedding_text(case, dictionaries: dict) -> str:
    """构造案例 embedding 文本，使用字典解释补充标签含义"""
    demand_hints = []
    for d in case.public_demands:
        item = dictionaries["public_demands"].get(d)
        if item:
            demand_hints.append(f"{d}表示{item['meaning']}")
    heat_item = dictionaries["heat_levels"].get(str(case.heat_level), {})
    strategy_hints = []
    for s in case.strategy_types:
        item = dictionaries["strategy_types"].get(s)
        if item:
            strategy_hints.append(f"{s}表示{item['meaning']}")
    return f"""案例名称：{case.title}
所属领域：{case.domain}
公众诉求：{'、'.join(case.public_demands)}。{'；'.join(demand_hints)}
热度等级：{case.heat_level}。{heat_item.get('meaning', '')}
策略类型：{'、'.join(case.strategy_types)}。{'；'.join(strategy_hints)}
事件描述：{case.event_description}
核心处置策略：{case.strategy_text}
处置效果：{case.effect_score or '未知'}""".strip()

def build_query_text(event_text: str, profile, dictionaries: dict) -> str:
    """构造检索 query_text，与 case embedding 使用同一字典解释"""
    demand_lines = []
    for demand in profile.public_demands:
        item = dictionaries["public_demands"].get(demand)
        if item:
            demand_lines.append(f"{demand}表示{item['meaning']}")
    heat_item = dictionaries["heat_levels"].get(str(profile.heat_level), {})
    return f"""当前事件：{event_text}
事件摘要：{profile.event_summary}
所属领域：{profile.domain}
公众诉求：{'、'.join(profile.public_demands)}。{'；'.join(demand_lines)}
热度等级：{profile.heat_level}，{heat_item.get('meaning', '')}
风险关键词：{'、'.join(profile.risk_keywords)}
检索目标：寻找相似历史案例及可借鉴处置策略。""".strip()
```

### 4.3 Services（4 文件）

**`backend/app/services/case_service.py`**

```python
import json
from sqlmodel import Session, select, func
from app.models.case import Case, CaseEmbedding
from app.schemas.case import CaseCreate, CaseUpdate, CaseResponse
from app.core.errors import NotFoundError

class CaseService:
    def __init__(self, session: Session):
        self.session = session

    def list_cases(self, q=None, domain=None, enabled=None, embedding_status=None, page=1, page_size=20):
        stmt = select(Case)
        if q: stmt = stmt.where(Case.title.contains(q))
        if domain: stmt = stmt.where(Case.domain == domain)
        if enabled is not None: stmt = stmt.where(Case.enabled == enabled)
        if embedding_status: stmt = stmt.where(Case.embedding_status == embedding_status)
        total = self.session.exec(select(func.count()).select_from(stmt.subquery())).one()
        stmt = stmt.offset((page - 1) * page_size).limit(page_size)
        items = self._to_responses(self.session.exec(stmt).all())
        return {"items": items, "total": total, "page": page, "page_size": page_size}

    def create(self, data: CaseCreate) -> CaseResponse:
        case = Case(
            case_code=data.case_code, title=data.title, domain=data.domain,
            public_demands_json=json.dumps(data.public_demands),
            heat_level=data.heat_level, response_speed=data.response_speed,
            effect_score=data.effect_score,
            strategy_types_json=json.dumps(data.strategy_types),
            event_description=data.event_description,
            strategy_text=data.strategy_text,
            vertical_subject=data.vertical_subject,
            carrier_target=data.carrier_target,
            trigger_reason=data.trigger_reason,
            risk_tags_json=json.dumps(data.risk_tags),
            notes=data.notes, enabled=True, embedding_status="none",
        )
        self.session.add(case)
        self.session.commit()
        self.session.refresh(case)
        return self._to_response(case)

    def get(self, case_id: int) -> CaseResponse:
        case = self.session.get(Case, case_id)
        if not case: raise NotFoundError("Case not found", "CASE_NOT_FOUND")
        return self._to_response(case)

    def update(self, case_id: int, data: CaseUpdate) -> CaseResponse:
        case = self.session.get(Case, case_id)
        if not case: raise NotFoundError("Case not found", "CASE_NOT_FOUND")
        update_data = data.model_dump(exclude_unset=True)
        for k, v in update_data.items():
            if k in ("public_demands", "strategy_types", "risk_tags"):
                setattr(case, f"{k}_json", json.dumps(v or []))
            elif hasattr(case, k):
                setattr(case, k, v)
        case.embedding_status = "none"  # 编辑后向量过期
        self.session.add(case)
        self.session.commit()
        self.session.refresh(case)
        return self._to_response(case)

    def delete(self, case_id: int) -> None:
        case = self.session.get(Case, case_id)
        if not case: raise NotFoundError("Case not found", "CASE_NOT_FOUND")
        # 级联删除关联 embedding
        stmt = select(CaseEmbedding).where(CaseEmbedding.case_id == case_id)
        for emb in self.session.exec(stmt).all():
            self.session.delete(emb)
        self.session.delete(case)
        self.session.commit()

    def toggle(self, case_id: int) -> CaseResponse:
        case = self.session.get(Case, case_id)
        if not case: raise NotFoundError("Case not found", "CASE_NOT_FOUND")
        case.enabled = not case.enabled
        self.session.add(case)
        self.session.commit()
        self.session.refresh(case)
        return self._to_response(case)

    def _to_response(self, case: Case) -> CaseResponse:
        return CaseResponse(
            id=case.id, case_code=case.case_code, title=case.title,
            domain=case.domain, public_demands=json.loads(case.public_demands_json),
            heat_level=case.heat_level, response_speed=case.response_speed,
            effect_score=case.effect_score,
            strategy_types=json.loads(case.strategy_types_json),
            event_description=case.event_description,
            strategy_text=case.strategy_text,
            vertical_subject=case.vertical_subject,
            carrier_target=case.carrier_target,
            trigger_reason=case.trigger_reason,
            risk_tags=json.loads(case.risk_tags_json),
            notes=case.notes, enabled=case.enabled,
            embedding_status=case.embedding_status,
            created_at=case.created_at, updated_at=case.updated_at,
        )

    def _to_responses(self, cases: list[Case]) -> list[CaseResponse]:
        return [self._to_response(c) for c in cases]
```

**`backend/app/services/csv_import_service.py`**

关键逻辑：

1. `pd.read_csv(file, header=None, skiprows=3)` 跳过前 3 行嵌套中文标题
2. 手动映射列索引到 Case 字段（因为列名包含换行符）
3. `df.drop(columns=[c for c in df.columns if 'Unnamed' in str(c)])` 删除空白列
4. 对每行：`normalize_case_row()` → 提取 domain → 拆分逗号字段 → 创建 Case
5. 返回 `ImportResult(imported=N, skipped=M, errors=[])`

**`backend/app/services/dictionary_service.py`**

```python
from sqlmodel import Session, select
from app.models.dictionary import BackgroundDictItem

def get_dictionaries(session: Session) -> dict:
    items = session.exec(select(BackgroundDictItem)).all()
    result = {"public_demands": [], "heat_levels": [], "strategy_types": [], "domain_labels": [], "domain_relations": []}
    for item in items:
        d = {"key": item.key, "label": item.label, "meaning": item.meaning, "report_hint": item.report_hint, "speech_hint": item.speech_hint, "risk_hint": item.risk_hint}
        if item.category == "domain_relations":
            d["domain_relations"] = item.extra_json
        if item.category in result:
            result[item.category].append(d)
    return result

def get_domain_relations(session: Session) -> dict[str, dict[str, float]]:
    items = session.exec(select(BackgroundDictItem).where(BackgroundDictItem.category == "domain_relations")).all()
    return {item.key: item.extra_json or {} for item in items}
```

**`backend/app/services/embedding_service.py`**

```python
from app.core.config import settings
from app.models.case import Case, CaseEmbedding
from app.clients.mock_client import MockEmbeddingClient
from app.utils.text_builders import build_case_embedding_text
from app.services.dictionary_service import get_dictionaries

def generate_embedding(case: Case, session) -> CaseEmbedding:
    dicts = get_dictionaries(session)
    text = build_case_embedding_text(case, dicts)
    # Mock 模式
    client = MockEmbeddingClient(dimensions=settings.qwen_embedding_dimensions)
    vector = client.embed(text)
    emb = CaseEmbedding(case_id=case.id, embedding_text=text, embedding_json=json.dumps(vector), model_name=client.model, dimensions=client.dimensions)
    session.add(emb)
    case.embedding_status = "ready"
    session.add(case)
    session.commit()
    return emb
```

### 4.4 验收

- [ ] `POST /api/cases` 创建案例 → 返回 201 + CaseResponse
- [ ] `GET /api/cases` 分页列表 → items/total/page/page_size
- [ ] `PUT /api/cases/{id}` 编辑 → embedding_status 变为 "none"
- [ ] `DELETE /api/cases/{id}` → 204，再次 GET 返回 404
- [ ] `POST /api/cases/import-csv` 上传 `data/Sheet1.csv` → imported=9~10
- [ ] 导入后 `cosine_similarity([1,0],[1,0])` = 1.0, `cosine_similarity([1,0],[0,1])` = 0.0
- [ ] Embedding 文本包含领域、诉求解释、热度解释、策略解释

---

## 5. 阶段 3：后端 RAG 管线（profile → retrieve → rerank → evidence_pack → report）

### 5.1 目标

实现完整 RAG 检索 → Evidence Pack → 报告生成管线。

### 5.2 文件清单

#### 5.2.1 Prompts（1 文件）

**`backend/app/prompts/report_segments.py`**

三个 prompt 模板：

- `ANALYSIS_AND_CASES_PROMPT` — 只基于 Evidence Pack，写入舆情画像 + 案例参考，≤800 字，禁止虚构传播数据
- `STRATEGY_AND_SPEECH_PROMPT` — 给出建议 + 至少一段回应话术，不承诺未调查事实，避免官腔
- `DISCLAIMER_PROMPT` — 80-180 字，明确小样本限制、模型生成、人工复核

#### 5.2.2 Services（6 文件）

**`backend/app/services/profile_service.py`**

`generate_profile(event_text, manual_hints, session) -> CurrentEventProfile`:
- Mock 模式：关键词匹配 → confidence = 0.75（启发式固定值）
- 合并 manual_hints 覆盖自动字段
- 返回 profile_source = "mixed" | "rule" | "manual"

**`backend/app/services/retrieval_service.py`**

`retrieve(query_text, profile, top_n, top_k, session) -> list[RetrievedCaseItem]`:
1. 查询全部 `enabled=true AND embedding_status=ready` 案例+嵌入
2. 计算 query vector（MockEmbeddingClient.embed）
3. 逐个 cosine_similarity → 排序取 Top-N
4. 传入 RerankService.rerank() → 返回 Top-K

**`backend/app/services/rerank_service.py`**

```python
def demand_score(query_demands, case_demands) -> float:
    """Jaccard 相似度，一方空返回 0.5"""
def heat_score(query_heat, case_heat) -> float:
    """1 - abs(diff)/4，归一化到 [0,1]"""
def domain_score(query_domain, case_domain, relations) -> float:
    """同域 1.0，查字典矩阵取值，未定义 0.0"""
def effect_score(effect) -> float:
    """effect/5，缺失返回 0.6"""

def final_score(scores, weights) -> float:
    return 0.45*s + 0.20*d + 0.15*h + 0.10*dom + 0.10*e

def rerank(candidates, query, weights, domain_relations) -> list[RetrievedCaseItem]:
    """按 final_score 降序排列，返回 top_k 条"""
```

**`backend/app/services/evidence_pack_service.py`**

`build_evidence_pack(event_text, profile, retrieved, dicts, session) -> EvidencePackResponse`

**`backend/app/services/report_generation_service.py`**

```python
def create_report(input_event_text, profile, evidence_pack, session) -> Report:
    """创建 Report + 3 个 ReportSegment（status=pending）"""

def generate_segment(report_id, segment_key, evidence_pack, session):
    """Mock → 用 MockLLMClient.chat() 生成对应段落"""

def regenerate_segment(report_id, segment_key, session):
    """重新生成指定段落，regenerated_count+1"""

def export_markdown(report, session) -> str:
    """拼接 3 段为 Markdown"""
```

#### 5.2.3 连线 API 路由

所有路由函数从占位改为调用真实 services。

### 5.3 验收

- [ ] 输入事件 → `POST /api/events/profile` → 返回 profile（domain/demands/heat/confidence）
- [ ] `POST /api/rag/retrieve` → 返回 query_text + results（每条含 5 个子分数 + final_score + explanation）
- [ ] `POST /api/rag/evidence-pack` → 返回完整 Evidence Pack（含 limitations）
- [ ] `POST /api/reports` → 创建 report（3 个 segment）
- [ ] 每个 segment 单独生成（mock 输出不同内容）
- [ ] `POST /api/reports/{id}/segments/{key}/regenerate` → 仅该段变化
- [ ] `GET /api/reports/{id}/export.md` → 包含三个固定标题
- [ ] final_score 降序排列
- [ ] 停用案例不在检索结果中
- [ ] DomainScore 同域=1.0，不同域=查矩阵，未定义=0.0

---

## 6. 阶段 4：前端 AppShell + 视觉系统

### 6.1 目标

建立前端架构骨架和统一视觉风格。

### 6.2 文件清单

| 文件 | 操作 | 关键内容 |
|---|---|---|
| `frontend/src/styles/tokens.css` | 创建 | CSS variables（--zx-bg, --zx-canvas, --zx-blue 等 19 个 token） |
| `frontend/src/styles/globals.css` | 修改 | `@import "tailwindcss"` + body 全局样式 |
| `frontend/src/app/providers.tsx` | 创建 | QueryClientProvider + TooltipProvider + BrowserRouter |
| `frontend/src/app/router.tsx` | 创建 | 6 条路由嵌套在 AppShell 内 |
| `frontend/src/components/shell/AppShell.tsx` | 创建 | Sidebar + TopBar + `<main><Outlet/></main>` |
| `frontend/src/components/shell/Sidebar.tsx` | 创建 | 6 个导航项 + ZhiXi logo |
| `frontend/src/components/shell/TopBar.tsx` | 创建 | Mock 模式指示灯 + API 状态 |
| `frontend/src/components/zhi/StageBackground.tsx` | 创建 | 黑色径向渐变 + 点阵噪声 |
| `frontend/src/components/zhi/BlueprintGrid.tsx` | 创建 | SVG `<pattern>` 点阵 + 坐标标注 |
| `frontend/src/components/zhi/ReportCanvas.tsx` | 创建 | 白灰画布容器 + 淡网格 |
| `frontend/src/lib/format.ts` | 创建 | formatPercent(n), formatDate(iso), formatScoreLabel(n) |
| `frontend/src/lib/scores.ts` | 创建 | ScoreBreakdown 类型, SCORE_LABELS 常量 |
| `frontend/src/lib/constants.ts` | 创建 | DOMAIN_OPTIONS, HEAT_OPTIONS, DEMAND_OPTIONS, STRATEGY_OPTIONS |
| `frontend/src/api/cases.ts` | 创建 | fetchCases, fetchCase, createCase, updateCase, deleteCase, importCsv, toggleCase |
| `frontend/src/api/rag.ts` | 创建 | generateProfile, retrieveCases, buildEvidencePack |
| `frontend/src/api/reports.ts` | 创建 | createReport, fetchReport, regenerateSegment, exportMarkdown |
| `frontend/src/api/settings.ts` | 创建 | fetchPublicSettings |
| `frontend/src/App.tsx` | 修改 | 替换为 `<Providers />` |

### 6.3 验收

- [ ] 路由完整：`/`, `/cases`, `/generate`, `/reports/:id`, `/settings`, `/evaluation`
- [ ] 黑色舞台背景可见
- [ ] 侧边栏导航可点击跳转
- [ ] 蓝图线稿元素存在但不遮挡内容
- [ ] `pnpm build` 通过
- [ ] 所有 API 函数走 `src/api/client.ts`

---

## 7. 阶段 5：前端案例库 UI（/cases）

### 7.1 文件清单

| 文件 | 操作 | 关键内容 |
|---|---|---|
| `frontend/src/pages/CaseLibraryPage.tsx` | 创建 | 完整页面：FilterRail + 工具栏 + 卡片网格 |
| `frontend/src/components/cases/CaseCard.tsx` | 创建 | 卡片：标题、领域 Badge、热度 Badge、向量状态 Badge、公众诉求 Chips、启用 Switch |
| `frontend/src/components/cases/CaseDetailDrawer.tsx` | 创建 | Sheet/Drawer：事件描述、策略、标签解释、embedding 文本预览 |
| `frontend/src/components/cases/CaseFormDialog.tsx` | 创建 | Dialog：React Hook Form + Zod schema，新增/编辑二合一 |
| `frontend/src/components/cases/EmbeddingPreview.tsx` | 创建 | 小面板：展示 embedding text |
| `frontend/src/hooks/useCases.ts` | 创建 | TanStack Query hooks：useCases, useCase, useCreateCase, useUpdateCase, useDeleteCase, useImportCsv, useToggleCase |
| `frontend/src/schemas/case.schema.ts` | 创建 | Zod schema：title 必填、domain 枚举、heat_level 1-5 等 |

### 7.2 验收

- [ ] 卡片网格展示案例
- [ ] 按领域/状态/向量状态筛选
- [ ] 新增案例弹窗
- [ ] 编辑案例弹窗（编辑后 embedding 状态重置）
- [ ] 删除二次确认
- [ ] 启用/停用开关
- [ ] CSV 导入按钮（上传文件 + toast 结果）
- [ ] 重新生成 embedding 按钮
- [ ] 空状态：提示导入 CSV 或新增案例
- [ ] loading/error/empty/success 四个状态覆盖

---

## 8. 阶段 6：前端智能生成 UI（/generate）

### 8.1 文件清单

| 文件 | 操作 | 关键内容 |
|---|---|---|
| `frontend/src/pages/GeneratePage.tsx` | 创建 | 双层布局：左输入/右结果 |
| `frontend/src/components/generate/EventInputPanel.tsx` | 创建 | 输入框 + 3 个示例按钮 + 字数统计（50-800） |
| `frontend/src/components/generate/ProfileEditor.tsx` | 创建 | 画像卡片：可编辑 domain/heat/demands/risk_keywords |
| `frontend/src/components/generate/RetrievedCaseCard.tsx` | 创建 | 检索结果卡片：final_score + 拆解分数 + 推荐理由 + 策略摘要 |
| `frontend/src/components/generate/SimilarityBreakdown.tsx` | 创建 | 5 个子分数条：语义/诉求/热度/领域/效果，百分比展示 |
| `frontend/src/components/generate/EvidencePackDrawer.tsx` | 创建 | Drawer：展示 Evidence Pack 内容 + limitations |
| `frontend/src/components/generate/RetrievalTimeline.tsx` | 创建 | SVG 扫描动效（检索中动画） |
| `frontend/src/hooks/useGenerateProfile.ts` | 创建 | useMutation → POST /api/events/profile |
| `frontend/src/hooks/useRetrieve.ts` | 创建 | useMutation → POST /api/rag/retrieve |
| `frontend/src/schemas/event.schema.ts` | 创建 | Zod: event_text min(50) max(800) |

### 8.2 交互状态机

```text
初始 → 输入事件文本 → [生成事件画像]
  → loading（扫描线动画）
  → 画像展示 → 用户可选编辑画像字段
  → [检索参考案例]
  → loading（RetrievalTimeline 动效）
  → Top-K 卡片展示
  → [生成三段式报告]
  → 跳转到 /reports/:id
```

### 8.3 验收

- [ ] 输入事件后点击"生成事件画像" → profile 展示
- [ ] 画像字段可编辑（domain/heat/demands/keywords）
- [ ] 编辑后检索使用修正后的画像
- [ ] 检索结果卡片展示 final_score + 5 子分数 + explanation
- [ ] 相似度拆解用百分比或条形图
- [ ] 无明显分数时显示 "—"（fallback）
- [ ] Evidence Pack 抽屉可查看
- [ ] 生成报告按钮在无检索结果时 disabled
- [ ] 生成中跳转到 `/reports/:id`

---

## 9. 阶段 7：前端报告页 UI（/reports/:id）

### 9.1 文件清单

| 文件 | 操作 | 关键内容 |
|---|---|---|
| `frontend/src/pages/ReportPage.tsx` | 创建 | 双栏：左 ReportCanvas + 右 EvidenceInspector |
| `frontend/src/components/reports/ReportSegmentCard.tsx` | 创建 | 段落卡片：生成状态指示器 + Markdown 渲染 + 操作按钮 |
| `frontend/src/components/reports/SegmentActionBar.tsx` | 创建 | 按钮组：重新生成/复制/查看依据 |
| `frontend/src/components/reports/EvidenceInspector.tsx` | 创建 | 侧面板：Evidence Pack 摘要 |
| `frontend/src/components/reports/ExportReportButton.tsx` | 创建 | 导出 Markdown 按钮 |
| `frontend/src/hooks/useReport.ts` | 创建 | useReport, useRegenerateSegment, useExportMarkdown |

### 9.2 验收

- [ ] 报告固定三段
- [ ] 每段可单独重新生成（loading → success toast）
- [ ] 每段可复制
- [ ] 每段可查看依据（Evidence Pack 抽屉）
- [ ] 报告不支持手动编辑文字
- [ ] 导出 Markdown 按钮可用
- [ ] 右侧 Evidence Inspector 展示匹配案例
- [ ] 三段全部使用 Evidence Pack 作为依据

---

## 10. 阶段 8：前端设置页 + 评估页 + 工作台

### 10.1 文件清单

| 文件 | 操作 | 关键内容 |
|---|---|---|
| `frontend/src/pages/DashboardPage.tsx` | 创建 | HeroStage + 4 MetricCards + PipelineBlueprint SVG + LimitNotice |
| `frontend/src/pages/SettingsPage.tsx` | 创建 | Mock 模式状态、模型名（只读）、Key 状态指示灯、权重表、字典查看 |
| `frontend/src/pages/EvaluationPage.tsx` | 创建 | DemoEventRail（3 按钮）+ EvaluationResultPanel + ManualScoreForm |

### 10.2 验收

- [ ] 工作台展示案例总数/可检索/已向量化/报告数
- [ ] 工作台展示 RAG 流程图（SVG）
- [ ] 设置页不显示真实 API Key
- [ ] 设置页显示检索权重表格
- [ ] 设置页字典可展开查看
- [ ] 评估页可运行 3 个测试事件
- [ ] 评估页展示 Top-K 和指标
- [ ] 所有页面覆盖 loading/error/empty/success

---

## 11. 阶段 9：脚本

### 11.1 文件清单

| 文件 | 操作 | 说明 |
|---|---|---|
| `backend/scripts/import_csv.py` | 创建 | CLI：`python scripts/import_csv.py <path>` → 调 CsvImportService → 打印 summary |
| `backend/scripts/rebuild_embeddings.py` | 创建 | CLI：`python scripts/rebuild_embeddings.py` → 遍历 non-ready cases → 生成 embedding |

### 11.2 验收

- [ ] `python scripts/import_csv.py ../data/Sheet1.csv` → 导入 9~10 条
- [ ] `python scripts/rebuild_embeddings.py` → 全部标记为 ready

---

## 12. 阶段 10：测试 + 演示打磨

### 12.1 文件清单

| 文件 | 操作 | 关键内容 |
|---|---|---|
| `backend/tests/conftest.py` | 创建 | pytest fixture: temp SQLite + mock_mode=True + TestClient |
| `backend/tests/unit/test_scores.py` | 创建 | test_demand_score, test_heat_score, test_domain_score, test_final_score |
| `backend/tests/unit/test_text_builders.py` | 创建 | test_embedding_text_contains_demands, test_query_text_formatted |
| `backend/tests/integration/test_cases_api.py` | 创建 | test_create/list/update/delete/toggle/import_csv |
| `backend/tests/integration/test_rag_api.py` | 创建 | test_retrieve_returns_top_k, test_scores_summary, test_disabled_excluded |
| `backend/tests/integration/test_reports_api.py` | 创建 | test_create_3_segments, test_regenerate_single, test_export_md |
| `backend/tests/integration/test_settings_api.py` | 创建 | test_no_real_key, test_weights_match_config |
| `frontend/src/components/cases/__tests__/CaseCard.test.tsx` | 创建 | 渲染检查 |
| `frontend/src/components/generate/__tests__/SimilarityBreakdown.test.tsx` | 创建 | 分数展示 + 百分比转换 |
| `frontend/src/components/reports/__tests__/ReportSegmentCard.test.tsx` | 创建 | loading/ready/failed 状态 |
| `frontend/e2e/demo-flow.spec.ts` | 创建 | Playwright：首页→案例库→智能生成→画像→检索→报告→导出 |
| `frontend/e2e/report-regenerate.spec.ts` | 创建 | Playwright：进入报告→重新生成第 2 段→验证第 1/3 段不变 |

### 12.2 验收

- [ ] `pytest` 全部通过
- [ ] `pnpm test` 全部通过
- [ ] `pnpm build` 无错误
- [ ] `pnpm e2e` demo-flow 通过
- [ ] 无 API Key 时可完整演示（Mock 模式）
- [ ] 设置页不泄露真实密钥
- [ ] 评估页可运行 golden events
- [ ] 报告不含"全网监测"、"PSM"、"DID"
- [ ] 报告含三段固定标题和免责声明

---

## 13. 功能优先级表

| 功能 | 优先级 | 所属阶段 |
|---|---|---|
| 根 .gitignore + Git 首次提交 | P0 | 0 |
| FastAPI + SQLite + health | P0 | 1 |
| Schemas (7 文件) | P0 | 1 |
| API 路由 (8 文件) | P0 | 1 |
| Utils (3 文件) | P0 | 2 |
| Case CRUD Service + API | P0 | 2 |
| CSV 导入 Service + API | P0 | 2 |
| Dictionary Service + API | P0 | 2 |
| Embedding Service + API | P0 | 2 |
| Prompts (1 文件) | P0 | 3 |
| Profile Service + API | P0 | 3 |
| RAG Retrieve + Rerank | P0 | 3 |
| Evidence Pack Service | P0 | 3 |
| Report Generation Service | P0 | 3 |
| 前端 AppShell + 视觉系统 | P0 | 4 |
| 案例库 UI | P0 | 5 |
| 智能生成 UI | P0 | 6 |
| 报告页 UI | P0 | 7 |
| 工作台 Dashboard | P1 | 8 |
| 设置页 | P1 | 8 |
| 评估页 | P1 | 8 |
| 脚本 (import/rebuild) | P1 | 9 |
| 后端测试 | P0 | 10 |
| 前端测试 | P0 | 10 |
| E2E 演示 | P1 | 10 |
| docx 导出 | P1 | 后续 |
| LangChain adapter | P2 | 后续 |

---

## 14. 最终交付验收

- [ ] 用户能导入或新增案例
- [ ] 用户能生成 embedding
- [ ] 用户能输入新事件（50-800 字）
- [ ] 系统能生成事件画像（含 confidence）
- [ ] 系统能检索 Top-K 参考案例（含 5 子分数 + explanation）
- [ ] 系统能生成三段式报告（每段独立生成）
- [ ] 用户能局部重生成报告段落
- [ ] 用户能导出 Markdown
- [ ] Mock 模式可完整跑通
- [ ] 风格符合黑色舞台 + 白灰画布 + 蓝图线稿 + 几何节点
- [ ] 报告明确免责声明
- [ ] 不出现"全网监测"、"PSM"、"DID"
- [ ] 设置页显示 key 状态不泄露真实密钥

---

## 15. 关键约束速查表

| # | 约束 | 来源 |
|---|---|---|
| 1 | 所有 ID 为 int | PRD 复查决策 #3 |
| 2 | 硬删除（级联删除 embedding） | PRD 复查决策 #9 |
| 3 | 编辑案例 → embedding_status = "none" | Backend 5.3 |
| 4 | Mock 模式 P0（无 API Key 可演示） | PRD 复查决策 #1 |
| 5 | 报告只有三段，分段独立生成 | CLAUDE.md #1 |
| 6 | Evidence Pack 是报告唯一依据 | CLAUDE.md #2 |
| 7 | 报告编辑 = 重生成/复制/导出（不支持手动编辑） | PRD 复查决策 #2 |
| 8 | DomainScore 使用字典关系矩阵查表 | PRD 复查决策 #4 |
| 9 | event_text: 50-800 chars | PRD 复查决策 #8 |
| 10 | 设置页不返回真实 API Key | AGENT.md #5 |
| 11 | DomainScore 未定义关系 = 0.0 | PRD 5.2.2 |
| 12 | EffectScore 缺失时 = 0.6 | PRD 6.5.4 |
| 13 | HeatScore = 1 - abs(diff)/4 | PRD 6.5.4 |
| 14 | Cosine 归一化到 [0, 1] | Backend 6.4.2 |
