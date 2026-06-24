---
name: zhixi-backend
description: Use this skill when implementing backend features for ZhiXi — FastAPI routes, SQLModel/SQLite data layer, RAG pipeline, embedding, report generation, mock mode, and API contract design.
---

# ZhiXi Backend Skill

## Required Context

Before implementing backend work, read:

1. `CLAUDE.md` — project rules and iron laws
2. `AGENT.md` — hard constraints and workflow
3. `docs/ZhiXi_Context_Docs/ZhiXi_PRD.md` — product requirements
4. `docs/ZhiXi_Context_Docs/ZhiXi_Backend.md` — full backend spec (read this thoroughly)
5. `docs/ZhiXi_Context_Docs/ZhiXi_Tech.md` — tech stack and initialization

Then check `docs/ZhiXi_Context_Docs/ZhiXi_Frontend.md` section 7 for API contract rules when coordinating with frontend.

## Tech Stack (Mandatory)

```text
Python 3.11+
FastAPI
Pydantic v2
SQLModel (preferred) or SQLAlchemy 2.x
SQLite (default DB)
Uvicorn
httpx
numpy
pandas
python-multipart
openai SDK compatible client (for Qwen/DashScope embedding and DeepSeek chat)
pytest
ruff
```

### Optional (do NOT make required)

```text
LangChain — adapter only, never core architecture
SQLite FTS5 — keyword recall supplement, optional
python-docx — P1 docx export
```

## Architecture

```text
FastAPI API Layer
  -> Pydantic/SQLModel Schemas
  -> Services
      CaseService, DictionaryService, EmbeddingService
      ProfileService, RetrievalService, RerankService
      EvidencePackService, ReportGenerationService
      ExportService, EvaluationService
  -> SQLite Repositories
  -> External Model Clients
      Qwen/DashScope Embedding Client
      DeepSeek Chat Client
      Mock LLM Client
```

### Directory Structure

```text
backend/
  app/
    main.py
    api/          -- health, dashboard, cases, dictionaries, events, rag, reports, settings, evaluation
    core/         -- config, logging, errors, security
    db/           -- session, init_db, seed
    models/       -- SQLModel table models
    schemas/      -- Pydantic request/response schemas
    services/     -- business logic
    clients/      -- embedding_client, llm_client, mock_client
    prompts/      -- profile_prompt, report_segments, review_prompt
    utils/        -- vectors, normalize, text_builders
  scripts/        -- import_csv.py, rebuild_embeddings.py
  tests/
    unit/
    integration/
    fixtures/
  pyproject.toml
  .env.example
```

## Database Design (SQLite)

### Tables

| Table | Purpose |
|---|---|
| `cases` | Case main body |
| `case_embeddings` | Embedding text + vector JSON per case |
| `background_dict_items` | Background dictionary items |
| `retrieval_runs` | Retrieval run logs |
| `retrieval_results` | Top-K results per retrieval |
| `reports` | Report main body |
| `report_segments` | 3 report segments |
| `llm_call_logs` | LLM call logs |
| `app_settings` | Public settings and mock state |

### Key Model Rules

- All IDs are `int` (SQLite auto-increment primary key)
- Embedding vectors stored as JSON text in `case_embeddings.embedding_json`
- Cosine similarity computed in Python via `numpy`
- JSON arrays stored as text fields: `public_demands_json`, `strategy_types_json`, `risk_tags_json`
- Case deletion is **hard delete** -- also delete associated `case_embeddings` records
- Updating a case resets `embedding_status` to `none`

## API Endpoints

```text
GET    /api/health
GET    /api/dashboard/summary

GET    /api/cases                  -- paginated, filterable
POST   /api/cases
GET    /api/cases/{case_id}
PUT    /api/cases/{case_id}        -- resets embedding_status
DELETE /api/cases/{case_id}        -- hard delete + cascade embeddings
POST   /api/cases/import-csv
POST   /api/cases/{case_id}/embedding
POST   /api/cases/rebuild-embeddings
POST   /api/cases/{case_id}/toggle

GET    /api/dictionaries
POST   /api/events/profile         -- returns CurrentEventProfile
POST   /api/rag/retrieve           -- returns Top-K + score breakdown
POST   /api/rag/evidence-pack

POST   /api/reports                -- creates report + 3 segments
GET    /api/reports/{report_id}
POST   /api/reports/{report_id}/segments/{segment_key}/regenerate
GET    /api/reports/{report_id}/export.md

GET    /api/settings/public        -- no real API keys!
POST   /api/evaluation/run-demo    -- P1, uses seed.py demo events
```

### API Conventions

- Backend fields: `snake_case`
- All timestamps: ISO 8601 strings
- All scores: 0-1 float
- Error format: `{"detail": "message", "code": "ERROR_CODE"}`
- `GET /api/settings/public` must NEVER return real API keys -- only `configured`/`missing` status

## RAG Pipeline

### Core Flow

```text
Case ingestion:
  normalize -> dictionary hints -> build embedding text -> embed -> save

Query flow:
  event input -> profile -> dictionary hints -> build query_text
  -> embed query -> vector recall Top-N -> weighted rerank -> Top-K
  -> build Evidence Pack -> 3-segment report generation
```

### Weighted Rerank Formula

```text
FinalScore =
  0.45 * SemanticScore    (cosine similarity, normalized 0-1)
+ 0.20 * DemandScore      (Jaccard similarity of public_demands sets)
+ 0.15 * HeatScore        (1 - |query_heat - case_heat| / 4)
+ 0.10 * DomainScore      (1.0 same, else lookup domain_relations matrix in dictionary)
+ 0.10 * EffectScore      (effect_score / 5, default 0.6 if missing)
```

### Cosine Similarity

```python
raw = dot(a, b) / (norm(a) * norm(b))   # range [-1, 1]
normalized = (raw + 1) / 2               # range [0, 1]
```

### Domain Score

Uses `domain_relations` matrix from background dictionary. Same domain = 1.0, otherwise lookup matrix value, undefined relation = 0.0.

## Mock Mode (P0 -- Must Work Without API Keys)

### Mock Embedding
Generate deterministic fake vectors from text hash. Same text -> same vector every time.

### Mock Profile
Rule-based extraction:
- Match domain by keywords
- Match public_demands by keywords (问责/公开/道歉/赔偿)
- Default heat 3; bump to 4-5 if "热搜/大量转发/爆" found
- confidence: fixed 0.70-0.85

### Mock Report
Template-based generation from Evidence Pack, filling placeholders with case data.

### Acceptance
- No API key -> full demo flow works
- Mock output is deterministic (stable for testing)
- UI clearly shows "Mock mode" indicator

## Report Generation

### 3 Segments (Independent LLM Calls)

1. `analysis_and_cases` -- event profile + historical case references
2. `strategy_and_speech` -- actionable recommendations + response speech drafts
3. `disclaimer` -- 80-180 chars, states limitations

Each segment is generated by a separate LLM call. Each can be regenerated independently. No 4th consistency review call -- that was removed from scope.

### Prompt Constraints

- Only use Evidence Pack as source material
- Never fabricate propagation data (views, shares, trending rankings)
- Never claim real all-network monitoring
- Segment 2 speech: use "阶段性说明"/"持续更新"/"依法依规核查" style expressions
- Segment 3: must mention small sample, model limitations, need for human review

## CSV Import Rules

- Remove `Unnamed:*` empty columns
- Standardize column names
- Empty strings -> None
- Split `public_demands` and `strategy_types` by `,`, `，`, `/`
- Extract heat_level (1-5) from text like `5级（主榜前3/"爆"）`
- Extract effect_score (1-5) similarly

## Environment Variables

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

## Common Commands

```bash
cd backend
source .venv/bin/activate          # Windows: .venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pytest
ruff check .
```

## Non-Negotiables

1. SQLite is the default DB -- do NOT require Postgres/pgvector/Qdrant
2. LangChain is optional adapter only -- never core architecture
3. Mock mode must always work without API keys
4. Report is exactly 3 segments, generated independently
5. Evidence Pack is the only source for report generation
6. Never expose real API keys -- settings endpoint returns status only
7. All IDs are `int`, all scores are 0-1 float
8. Case deletion is hard delete with cascade
9. DomainScore uses dictionary relationship matrix, not hardcoded pairs
10. Evaluation demo events come from `seed.py`
