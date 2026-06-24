---
name: zhixi-frontend
description: Use this skill when implementing frontend features for ZhiXi — React components, pages, visual style, design system, motion effects, API integration, form validation, and demo-ready UI polish.
---

# ZhiXi Frontend Skill

## Required Context

Before implementing frontend work, read:

1. `CLAUDE.md` — project rules and iron laws
2. `AGENT.md` — hard constraints and workflow
3. `docs/ZhiXi_Context_Docs/ZhiXi_PRD.md` — product requirements
4. `docs/ZhiXi_Context_Docs/ZhiXi_Frontend.md` — full frontend spec (read this thoroughly)
5. `docs/ZhiXi_Context_Docs/ZhiXi_Tech.md` — tech stack and initialization

Then check `docs/ZhiXi_Context_Docs/ZhiXi_Backend.md` section 5 for API contracts when integrating.

## Tech Stack (Mandatory)

```text
Vite + React + TypeScript
Tailwind CSS v4
shadcn/ui + Radix UI
TanStack Query (server state)
React Router (routing — do NOT switch to TanStack Router)
Zod + React Hook Form (forms and validation)
Motion for React (restrained motion)
Recharts or Tremor (data visualization)
lucide-react (icons)
sonner (toasts)
openapi-typescript / openapi-fetch (API types from FastAPI)
Vitest + React Testing Library (unit tests)
Playwright (E2E tests)
```

## Visual System

### Color Tokens

Use CSS variables exclusively. Never hardcode colors in components.

```css
:root {
  --zx-bg: #030406;          /* 近黑舞台 */
  --zx-bg-soft: #07090d;
  --zx-stage: #0b0d12;       /* 暗色卡片/侧栏 */
  --zx-canvas: #eef3f4;      /* 报告/内容画布 */
  --zx-canvas-soft: #dfe8ea;
  --zx-ink: #111827;         /* 正文色 */
  --zx-muted: #7b8794;
  --zx-line: rgba(44, 102, 176, 0.42);  /* 工程线 */
  --zx-blue: #2f6fed;        /* 强调色 */
  --zx-blue-soft: #85aef8;
  --zx-cyan: #b7e4ff;
  --zx-white: #f8fbff;
  --zx-danger: #e15b64;
  --zx-warning: #e8b85d;
  --zx-success: #7ccfa5;
}
```

### Style Rules

- **黑色舞台**：全局背景近黑径向渐变，不做纯黑死板块
- **白灰画布**：报告和输入区使用 `--zx-canvas` 高亮背景
- **蓝图线稿**：SVG 网格、节点连线、坐标辅助线，opacity < 0.18
- **几何标注**：小号等宽字体数字标签，轻量漂浮感
- **报告正文**：对比度优先，可读性高于风格
- **禁止**：复制用户参考图中的人物、Logo、Bilibili UI、明日方舟素材

### Typography

```css
font-family: Inter, "Noto Sans SC", "PingFang SC", "Microsoft YaHei", sans-serif;
/* 数字和分数使用等宽字体 */
font-family: "JetBrains Mono", "SFMono-Regular", Consolas, monospace;
```

### Motion Principles

1. Only animate on state change, no idle background loops
2. Single motion 120-600ms
3. Background floating elements opacity < 0.2
4. Respect `prefers-reduced-motion`
5. Never block report text reading

## Page Routes

| Route | Priority | Description |
|---|---|---|
| `/` | P1 | Dashboard — system status, case count, recent reports, flow diagram |
| `/cases` | P0 | Case library — CRUD, CSV import, embedding management |
| `/generate` | P0 | Smart generate — event input → profile → retrieval → report |
| `/reports/:id` | P0 | Report view — 3 segments, regenerate, copy, export MD |
| `/settings` | P1 | Settings — mock mode, model names, weights, dictionary viewer |
| `/evaluation` | P1 | Evaluation — fixed demo events, Top-K, manual scoring |

### Priority Order

P0 pages first: `/cases` → `/generate` → `/reports/:id`
Then P1: `/settings`, `/evaluation`

## Key Behavioral Rules

### API Contract

- All requests through `src/api/client.ts` — no bare `fetch()`
- Use `openapi-typescript` generated types from FastAPI OpenAPI
- Never hand-write backend response types
- API fields: `snake_case` from backend; convert to display labels only in UI
- All IDs are `number` (int), matching backend SQLite auto-increment

### Report Page Rules

- Report is exactly 3 segments, generated independently
- No manual text editing — only regenerate/copy/export per segment
- After clicking "generate report" on `/generate`, navigate to `/reports/:id`
- Each segment shows: title, markdown content, regenerate button, copy button, evidence link

### Event Input Validation

- `event_text`: min 50 chars, max 800 chars (Zod schema)
- `domain`: optional enum from dictionary
- `public_demands`: optional multi-select from dictionary
- `heat_level`: optional 1-5

### Mock Mode

- Frontend must display mock mode status (from `GET /api/settings/public`)
- Never expose or read API keys in frontend
- All flows must work without API key when backend is in mock mode

### State Coverage

Every page must have: loading, empty, error, success states.

## Form Rules

- React Hook Form + Zod schema + shadcn Form
- Long text → textarea
- Multi-select → chips + command
- Heat level → segmented control or slider
- Effect score → rating dots

## Directory Structure

```text
frontend/src/
  app/           — App.tsx, providers.tsx, router.tsx
  pages/         — one file per route
  components/
    shell/       — AppShell, Sidebar, TopBar
    zhi/         — BlueprintGrid, StageBackground, VectorLineOverlay, GlyphBirds, ReportCanvas
    cases/       — CaseCard, CaseDetailDrawer, CaseFormDialog, EmbeddingPreview
    generate/    — EventInputPanel, ProfileEditor, RetrievedCaseCard, SimilarityBreakdown
    reports/     — ReportSegmentCard, SegmentActionBar, EvidenceInspector, ExportReportButton
    ui/          — shadcn/ui components
  api/           — client.ts, generated.ts, cases.ts, rag.ts, reports.ts, settings.ts
  hooks/         — useCases, useGenerateProfile, useRetrieve, useReport
  schemas/       — case.schema.ts, event.schema.ts
  lib/           — cn.ts, format.ts, scores.ts, constants.ts
  styles/        — globals.css, tokens.css
```

## Common Commands

```bash
cd frontend
pnpm dev           # start dev server
pnpm gen:api       # regenerate API types from backend OpenAPI
pnpm lint          # eslint
pnpm test          # vitest
pnpm build         # production build (tsc -b && vite build)
pnpm e2e           # playwright
```

## Non-Negotiables

1. No bare `fetch()` in components
2. No API keys in frontend code, UI, or fixtures
3. No `any` types — use OpenAPI generated types
4. Report page: only 3 segments, no manual editing
5. IDs are `number` everywhere
6. Event text validation: 50-800 chars
7. Respect `prefers-reduced-motion`
8. Never copy reference image IP/logos/characters
