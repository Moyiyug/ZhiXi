---
name: zhixi-context
description: Use this skill for ZhiXi project implementation, review, documentation, or context-audit tasks involving the PRD, Tech stack, frontend/backend API contract, RAG pipeline, report generation, testing, Claude Code configuration, or demo-readiness constraints.
---

# ZhiXi Context

Use this skill to work inside the ZhiXi repository without rediscovering the project rules. Keep changes aligned with the documented PRD, Tech stack, and demo-first constraints.

## Required Context

Start from these files:

1. `AGENT.md`
2. `CLAUDE.md`
3. `docs/ZhiXi_Context_Docs/ZhiXi_PRD.md`
4. `docs/ZhiXi_Context_Docs/ZhiXi_Tech.md`

Then load only the task-relevant spec:

- Frontend work: `docs/ZhiXi_Context_Docs/ZhiXi_Frontend.md`
- Backend/API/RAG work: `docs/ZhiXi_Context_Docs/ZhiXi_Backend.md`
- Tests or QA: `docs/ZhiXi_Context_Docs/ZhiXi_Test.md`
- Planning or sequencing: `docs/ZhiXi_Context_Docs/ZhiXi_DevPlan.md`

For broad audits, read `references/context-map.md` after the required files.

## Non-Negotiables

- Reports are exactly three segments: analysis and cases, strategy and speech, disclaimer.
- Generate each report segment independently; do not create a single long report call.
- Evidence Pack is the only source for report generation.
- Use SQLite by default; do not make Postgres, pgvector, Qdrant, Chroma, Celery, LangGraph, or multi-agent frameworks required for P0.
- Use FastAPI, SQLModel, Pydantic v2, SQLite, numpy, pytest, and ruff for backend work.
- Use Vite, React, TypeScript, Tailwind CSS v4, shadcn/ui, TanStack Query, React Router, Zod, React Hook Form, Motion, Vitest, and Playwright for frontend work.
- Keep Mock mode available. No API key may be required for the demo path.
- Never expose real API keys in frontend code, UI, logs, fixtures, screenshots, or docs.
- Do not claim real all-network monitoring, strict causal proof, or production decision authority.
- Translate reference-image style into black stage, white/gray report canvas, blue blueprint linework, and geometric nodes; do not copy specific IP, logos, characters, or source screenshots.

## Contract Checks

Before changing code or docs, check the relevant contract:

- PRD API list: `docs/ZhiXi_Context_Docs/ZhiXi_PRD.md` section 7.
- Backend API details: `docs/ZhiXi_Context_Docs/ZhiXi_Backend.md` section 5.
- Frontend routes: `docs/ZhiXi_Context_Docs/ZhiXi_PRD.md` section 4.1 and `docs/ZhiXi_Context_Docs/ZhiXi_Frontend.md` section 5.
- Development coverage: `docs/ZhiXi_Context_Docs/ZhiXi_DevPlan.md` sections 1, 12, and 13.
- Test coverage: `docs/ZhiXi_Context_Docs/ZhiXi_Test.md`.

If one document changes a core contract, update the dependent docs in the same task.

## Implementation Workflow

1. Identify whether the task is frontend, backend, RAG/reporting, testing, docs, or configuration.
2. Read the smallest matching spec set from Required Context.
3. Preserve P0 behavior before adding P1/P2 polish.
4. Prefer generated OpenAPI types on the frontend; avoid hand-written duplicate response types.
5. Keep API fields in snake_case from backend to OpenAPI; convert display labels only in UI.
6. Add or update focused tests for contract, RAG scoring, report structure, and demo flow when behavior changes.
7. Run the relevant documented commands, or state why they could not be run.

## Common Commands

Backend:

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
pytest
ruff check .
```

Frontend:

```bash
cd frontend
pnpm gen:api
pnpm lint
pnpm test
pnpm build
pnpm e2e
```
