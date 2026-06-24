---
name: zhixi-test
description: Use this skill when writing or running tests for ZhiXi -- backend pytest unit/integration tests, frontend Vitest component tests, Playwright E2E tests, RAG regression tests, and prompt safety regression tests.
---

# ZhiXi Test Skill

## Required Context

Before writing tests, read:

1. `CLAUDE.md` -- project rules and iron laws
2. `docs/ZhiXi_Context_Docs/ZhiXi_Test.md` -- full test strategy (read this thoroughly)
3. `docs/ZhiXi_Context_Docs/ZhiXi_PRD.md` -- product requirements and acceptance criteria
4. `docs/ZhiXi_Context_Docs/ZhiXi_Backend.md` -- backend API contracts
5. `docs/ZhiXi_Context_Docs/ZhiXi_Frontend.md` -- frontend component specs

## Test Goals

This is a demo-first course project. Tests prioritize:

1. Core demo path stability
2. Case ingestion, retrieval, segmented report generation closed loop
3. Small-sample RAG logic is explainable and correct
4. Frontend-backend API field consistency
5. Mock mode works without API keys
6. Reports never violate PRD constraints (long reports, fabricated data)

## Test Layers

| Layer | Goal | Tools | Priority |
|---|---|---|---|
| Unit | Function/component logic | Vitest / pytest | P0 |
| Integration | API + SQLite + Service | pytest + TestClient | P0 |
| Contract | Frontend-backend type match | OpenAPI + TS build | P0 |
| E2E | Full demo path | Playwright | P1, but must pass before demo |
| Prompt Regression | Report structure stays correct | pytest mock/golden | P0 |
| Visual Smoke | Style doesn't break | Playwright screenshot | P1 |

## Backend Tests

### Test Directory

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

### conftest.py Requirements

- Use temporary SQLite database
- Set `APP_MOCK_MODE=true`
- Override external model clients
- Isolate data per test

```python
@pytest.fixture()
def client(tmp_path):
    db_path = tmp_path / "test.db"
    app = create_app(database_url=f"sqlite:///{db_path}", mock_mode=True)
    init_test_db(app)
    return TestClient(app)
```

### Unit Tests: Field Normalization

| Case | Input | Expected |
|---|---|---|
| Remove empty columns | `Unnamed: 25` | Not in Case |
| Extract heat level | `5级（主榜前3）` | `heat_level=5` |
| Extract effect score | `4级（显著修复）` | `effect_score=4` |
| Split strategies | `行动补救型,快速道歉型` | `['行动补救型','快速道歉型']` |
| Empty field | NaN | None or [] |

### Unit Tests: Score Calculation

**demand_score:**
- Full match: 1.0
- Partial match: Jaccard ratio
- One side empty: 0.5

**heat_score:**
- Same level: 1.0
- Diff 1: 0.75
- Diff 4: 0.0

**domain_score:**
- Same domain: 1.0
- Dictionary matrix related: lookup value
- Undefined relation: 0.0

**final_score weighted sum:**

```python
def test_final_score_weighted_sum():
    scores = {"semantic": 0.8, "demand": 1.0, "heat": 0.75, "domain": 1.0, "effect": 0.8}
    weights = {"semantic": 0.45, "demand": 0.20, "heat": 0.15, "domain": 0.10, "effect": 0.10}
    assert final_score(scores, weights) == 0.8525
```

### Unit Tests: Embedding Text Construction

- Contains case name, domain, public demands with hints, heat with hint, strategy text
- Does NOT contain `nan` or `None` strings

### Integration Tests: Cases API

| API | Test |
|---|---|
| `POST /api/cases` | Create succeeds |
| `GET /api/cases` | List returns results |
| `PUT /api/cases/{id}` | Update resets embedding_status to none |
| `POST /api/cases/{id}/toggle` | Disabled case excluded from retrieval |
| `DELETE /api/cases/{id}` | Hard delete, returns 404 after |
| `POST /api/cases/import-csv` | Import succeeds |

### Integration Tests: RAG API

Checks:
- Returns query_text and results array
- Each result has 5 sub-scores, final_score in [0, 1]
- Disabled cases do not appear
- No ready embeddings returns empty with explanation

### Integration Tests: Reports API

| Case | Expected |
|---|---|
| Create report | 3 segments created |
| Segmented generation | Each segment generation_status=ready |
| Regenerate one segment | Only that segment changes |
| Markdown export | Contains all 3 fixed titles |
| Mock mode | Succeeds without API key |

### Prompt Safety Regression

Report MUST contain exactly these 3 titles and MUST NOT contain fabricated monitoring data or causal claims.

### Integration Tests: Settings API

- Does NOT return real API keys
- Key status only allows configured / missing

### Integration Tests: Evaluation API

- golden_event from seed.py can run
- Returns profile, results, metrics
- average_final_score in [0, 1]

## Frontend Tests

### Component Tests

**CaseCard:** Renders name, badges, heat, vector status. Click triggers detail.

**SimilarityBreakdown:** Shows final_score + 5 sub-scores as percentages. Missing values have fallback.

**ReportSegmentCard:** Shows title/markdown. Loading skeleton. Failed retry. Regenerate callback.

### Page Tests: GeneratePage

1. Input event text (50-800 chars)
2. Generate profile, wait for display
3. Modify heat level
4. Retrieve cases, wait for Top-3
5. Generate report, verify navigation to /reports/:id

### E2E: Demo Flow

Full path: homepage -> case library -> smart generate -> example input -> profile -> retrieve -> report (3 segments) -> export markdown.

## RAG Regression: Golden Cases

From seed.py: golden_event_1 (food safety), golden_event_2 (NPC controversy), golden_event_3 (government opacity).

Checks: Top-K not empty, final_score descending, explanation non-empty, Evidence Pack clean.

## API Contract Test

After backend schema changes: `pnpm gen:api && pnpm build`. Pass = contract consistent.

## Common Commands

```bash
# Backend
cd backend && pytest

# Frontend
cd frontend && pnpm test && pnpm e2e && pnpm build
```

## Non-Negotiables

1. Backend tests MUST use temporary SQLite and Mock model client
2. Frontend tests MUST cover GeneratePage flow, ReportSegmentCard, SimilarityBreakdown
3. E2E MUST run full demo path
4. Prompt safety tests MUST pass
5. All IDs in test data are number/int, not strings
6. Event text in tests is 50-800 chars
