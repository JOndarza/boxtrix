# Roadmap

## Current phase: Stabilization

The in-house packing pipeline and 3D frontend renderer are live. The backend was fully rewritten from NestJS/BinPackingJS to ASP.NET Core (.NET 10) with an eleven-stage pipeline implementing the Extreme Points heuristic (Crainic et al. 2008).

### Done

- Backend: Clean Architecture on ASP.NET Core minimal API (.NET 10 / C# 13)
- Algorithm: in-house eleven-stage PackingPipeline (Extreme Points heuristic, stability validation, compaction)
- New input fields: `accessCorner` (4 floor corners), `exitCorridor` (AABB), `weight` per box
- Frontend: Angular 21 with Three.js 3D scene; exit-corridor rendered as translucent red mesh
- Docker: dev image (`Dockerfile.dev`) and production image (`Dockerfile`) both verified
- Tests: 96 backend tests (Domain 34, Application 53, Api 9) — 0 failures

### In progress / near-term gaps

- Frontend test coverage at 0% for new code (InputPanelService, canvas component, Area.class.ts)
- No CI/CD pipeline (`.github/workflows/` absent)
- Domain errors return 500 — needs RFC 7807 exception handler
- No structured logging in pipeline stages

## Planned / known gaps

- JWT auth wired but not enforced on `POST /organize/sort`
- No production `docker-compose.prod.yml`
- Validation: negative area dimensions and empty boxes array not rejected
- Property test for corner-flip roundtrip (currently 4-case `[Theory]`, original plan called for 10 000 random positions)

## Decisions log

| Date | Decision | Reason |
|---|---|---|
| 2026-04 | Replace NestJS + BinPackingJS with ASP.NET Core + in-house pipeline | BinPackingJS lacked stacking constraints, accessCorner, exitCorridor, and weight-based sorting |
| 2026-04 | Corner enum reduced to 4 floor corners only | Top corners duplicate bottom behaviour under gravity-up packing |
| 2026-04 | PositionFinder lex order changed to (Y, Z, X) | Bug: previous (Z, X, Y) stacked vertically before filling the floor |
| 2026-04 | NestJS deleted directly, no feature flag | User decision: direct replacement, no parallel-run period |
| 2026-04 | DTOs kept as manual mirrors (TS ↔ C#) | Cost of wiring openapi-typescript exceeded maintaining two ~30-line files |
| — | Three.js for frontend 3D rendering | De-facto standard for web 3D |
| — | No DB (stateless API) | Sorting is pure computation — no persistence needed |
