# Handoff — .NET migration (session continuation)

**Date**: 2026-04-25
**Status**: backend migration complete and verified; gaps below before declaring done.

## What was done

- Replaced `backend/` (NestJS + binpackingjs) with ASP.NET Core minimal API on **.NET 10**.
- Implemented an in-house **PackingPipeline** with eleven specialised stages:
  `Normalizer → AreaPreprocessor → BoxSorter → AreaSelector` (per area: `LayerSlicer → RotationOptimizer → PositionFinder → StabilityValidator → Compactor`) `→ UnfittedCollector → Denormalizer`.
- Algorithm: **Extreme Points heuristic** (Crainic, Perboli, Tadei 2008) with stacking constraints (≥70 % support + CoG inside support polygon).
- New features wired end-to-end: `accessCorner` (4 floor corners), `exitCorridor` (AABB), `weight` per box (heavier-first sort).
- Frontend Angular updated: DTOs, `Corner.enum.ts`, form selects + corridor toggle + weight input, `CanvasComponent.drawExitCorridor`, demo data showcasing corner+corridor on Main Shelf.
- Docker dev (`backend/Dockerfile.dev`) and runtime (`backend/Dockerfile`) plus `docker-compose.dev.yml` updated.
- Project rules synchronised: `CLAUDE.md`, `.claude/rules/{architecture,tech-stack,coding-rules}.md`.
- Legacy `backend/` (NestJS) deleted from the repo.

### Decisions that diverged from the original plan

- **Corner enum reduced to 4 (floor only)** — `BottomFront{Left,Right}`, `BottomBack{Left,Right}`. Top corners removed because gravity always packs bottom-up; Top* would have produced duplicate behaviour.
- **PositionFinder lex order changed from `(Z, X, Y)` to `(Y, Z, X)`** — bug discovered by the `Picks_lex_smallest_y_z_x_extreme_point_so_floor_fills_first` test. The previous order made boxes stack vertically before filling the floor.
- **Legacy NestJS deleted directly** (no feature flag) — the user explicitly chose "reemplazo directo".
- **DTOs kept as manual mirrors** between TS and C# (no OpenAPI codegen yet) because Angular already had hand-written DTOs and the cost of wiring `openapi-typescript` was higher than maintaining two ~30-line files.

## Verification snapshot

- `dotnet build` — 7 projects, 0 errors, 0 warnings (`Directory.Build.props` enforces `TreatWarningsAsErrors=true`).
- `dotnet test` — **96 tests, 0 failures**. Domain 34, Application 53, Api 9.
- `ng build --configuration=development` — bundle 3.19 MB, 0 errors.
- Smoke test against running API verified: corner mirror, bottom-up sort, UNFITTED virtual, exit corridor honoured.

## Pending — prioritised

### P1 — risk-bearing gaps

1. **Frontend tests are at 0 % for the new code.**
   Karma + Jasmine already configured; nothing has been written for the Corner select, the corridor toggle, `drawExitCorridor`, the `Area.exitCorridor` field, or the `loadJSON` path with old-format inputs.
   Files: `frontend/src/app/components/layout/input-panel/`, `frontend/src/app/components/canvas/canvas.component.ts`, `frontend/src/app/common/classes/rendered/Area.class.ts`, `frontend/src/app/shared/services/InputPanel.service.ts`.

2. **Production Dockerfile (`backend/Dockerfile`) was written but never built.**
   Verify with `docker build -t boxtrix-api backend/` and a smoke `docker run -e FRONTEND_ORIGIN=http://localhost:4400 -p 4200:4200 boxtrix-api` round-trip on `POST /organize/sort`.

3. **Legacy fields in DTO are dead weight.**
   `ConstraintsDto.MustBeAccessible`, `SwitchZforY`, `Stackable` are accepted but ignored by the pipeline. Either delete them from `backend/src/BoxTrix.Api/Dtos/InputDto.cs` (and `frontend/src/app/common/dtos/Input.interface.ts`) or implement them. Recommendation: delete — nobody depends on the behaviour, and accepting silently-ignored fields is misleading.

### P2 — documentation drift

4. **Stale docs that still mention NestJS / binpackingjs**:
   - `docs/deployment.md`
   - `docs/roadmap.md`
   - `docs/api-contracts.md` (also missing the new fields `accessCorner`, `exitCorridor`, `weight`)

5. **`docs/README.md`** governance file — verify references to old structure.

6. **`samples/*.json`** (8 files) are pre-migration. They still load (all new fields are optional with defaults), but none showcase corner/corridor/weight. At least one (probably `00-demo.json`) should mirror the demo data added to `Processor.service.ts`.

### P3 — quality / observability

7. **No structured logging in pipeline stages.**
   Inject `ILogger<T>` into stages (at least `PackingPipeline` and `PositionFinderStage`). Optional: add Serilog console sink in `Program.cs`.

8. **Domain errors return 500.**
   `ArgumentException` thrown from `NormalizerStage` propagates as a generic 500. Add a `Microsoft.AspNetCore.Diagnostics.IExceptionHandler` (or middleware) that maps domain exceptions to RFC 7807 ProblemDetails responses with proper status codes.

9. **No production `docker-compose.prod.yml`** — only `docker-compose.dev.yml` exists.

### P4 — nice to have

10. **Property test for the corner-flip roundtrip** (FsCheck.Xunit) — the original plan called for 10 000 random positions per corner; the current implementation uses a 4-case `[Theory]`.

11. **Validation gaps**: `area.x/y/z` are not checked against negatives; empty `boxes` array is accepted silently.

12. **`samples/*.json` JSON-load test** — add a frontend test that `Processor.loadJSON` correctly applies defaults when reading an old-format file.

13. **README**: add explicit `/swagger` URL and a section for running tests separately (`dotnet test backend/tests/BoxTrix.Application.Tests`, etc.).

## Explicitly out of scope (per user)

- **CI workflow** — `.github/workflows/` does not exist; the user excluded creating it. When the user wants it, the deliverable is a workflow that runs `dotnet build + test` on push/PR plus `ng build` plus optional docker-compose smoke.

## Useful entry points for the next session

| Goal | File |
|---|---|
| Pipeline orchestrator | `backend/src/BoxTrix.Application/Pipeline/PackingPipeline.cs` |
| Algorithm core | `backend/src/BoxTrix.Application/Pipeline/Stages/PositionFinderStage.cs` |
| Corner / flip logic | `backend/src/BoxTrix.Application/Pipeline/AreaContext.cs` (and `Stages/DenormalizerStage.cs`) |
| Stability rules | `backend/src/BoxTrix.Domain/Functions/GeometryFunctions.cs` |
| HTTP contract | `backend/src/BoxTrix.Api/Endpoints/OrganizeEndpoints.cs` + `backend/src/BoxTrix.Api/Dtos/` |
| Validation | `backend/src/BoxTrix.Api/Validators/InputValidator.cs` |
| Frontend exit-corridor render | `frontend/src/app/components/canvas/canvas.component.ts` (`drawExitCorridor`) |
| Frontend form | `frontend/src/app/components/layout/input-panel/` |
| Demo data | `frontend/src/app/shared/services/Processor.service.ts` |
| Original plan | `/Users/skull/.claude/plans/necesitamops-cambiar-el-algortimo-foamy-snowflake.md` |

## Run cheatsheet

```sh
# Backend dev
cd backend
dotnet watch --project src/BoxTrix.Api/BoxTrix.Api.csproj run

# Backend tests
cd backend && dotnet test

# Frontend dev
cd frontend && npm start

# Frontend build
cd frontend && node_modules/.bin/ng build --configuration=development

# Docker dev (whole stack)
docker compose -f docker-compose.dev.yml up
```

Backend dev port: **4200**. Frontend dev port: **4400** (mapped from container's 4100 in compose). Swagger: `http://localhost:4200/swagger`.
