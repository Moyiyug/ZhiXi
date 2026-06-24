# ZhiXi Context Map

Use this reference only for broad audits, onboarding, or when the task spans multiple specs.

## Source Of Truth

- Product requirements: `docs/ZhiXi_Context_Docs/ZhiXi_PRD.md`
- Technical stack and initialization: `docs/ZhiXi_Context_Docs/ZhiXi_Tech.md`
- Backend/API/RAG/report generation: `docs/ZhiXi_Context_Docs/ZhiXi_Backend.md`
- Frontend/routes/visual system/components: `docs/ZhiXi_Context_Docs/ZhiXi_Frontend.md`
- Tests/QA/golden cases: `docs/ZhiXi_Context_Docs/ZhiXi_Test.md`
- Sequencing and delivery plan: `docs/ZhiXi_Context_Docs/ZhiXi_DevPlan.md`
- Agent entry points: `AGENT.md`, `CLAUDE.md`

## Stable Contracts

- P0 pages: `/cases`, `/generate`, `/reports/:id`
- P1 pages: `/`, `/settings`, `/evaluation`
- Required public APIs include health, dashboard summary, cases, dictionaries, events profile, RAG retrieve, evidence pack, reports, settings public, and evaluation run-demo.
- RAG formula:

```text
FinalScore =
0.45 * SemanticScore
+ 0.20 * DemandScore
+ 0.15 * HeatScore
+ 0.10 * DomainScore
+ 0.10 * EffectScore
```

## Change Propagation

- PRD changes require checking Frontend, Backend, Test, and DevPlan.
- API schema changes require Backend docs, OpenAPI generation, frontend client/types, and contract tests.
- RAG formula changes require PRD, Backend implementation notes, and Test score expectations.
- Tech stack changes require Tech, AGENT, CLAUDE, the project skill, and implementation docs.
