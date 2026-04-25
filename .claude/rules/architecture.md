<!-- mirrors: docs/architecture.md -->

# Architecture — key patterns

- **Style**: Clean Architecture — `BoxTrix.Domain` (entities, value objects, enums, geometry) ← `BoxTrix.Application` (pipeline + stages) ← `BoxTrix.Api` (HTTP, DTOs, validators). Domain has zero dependencies; Application references only Domain
- **Pipeline**: eleven specialised stages live in `backend/src/BoxTrix.Application/Pipeline/Stages/`. The `PackingPipeline` orchestrator wires them in sequence; each stage is a singleton with a single responsibility (swappable without touching the others)
- **Algorithm**: Extreme Points heuristic (Crainic et al. 2008) inside `LayerSlicer` + `PositionFinder`; `StabilityValidator` enforces ≥ 70 % support and CoG inside the support polygon; `Compactor` greedy-pushes toward origin
- **Coordinate transform**: `AreaPreprocessor` maps the user's `accessCorner` to canonical (0,0,0) via X/Z flips; the `Denormalizer` undoes the flip per area on the way out so user-space coordinates remain anchored to the chosen corner
- **Forbidden regions**: `IArea.exitCorridor` (AABB) is honoured by `PositionFinder`; the frontend renders it as a translucent red mesh inside the area container
- **Routing**: minimal API `MapPost("/organize/sort", ...)` in `BoxTrix.Api/Endpoints/OrganizeEndpoints.cs`. JWT not yet wired (public)
- **Scaling**: Normalizer multiplies decimal user inputs by 10^5 for integer-exact packing; Denormalizer divides on the way out
- **Frontend**: Angular services layer (`common/api/`, `shared/services/`) mediates all HTTP; Three.js objects in `common/classes/rendered/`
- **Components**: all Angular components are standalone; imported directly in `AppComponent`
- **Error handling**: ASP.NET Core's default ProblemDetails handler returns 400 on `ValidationProblem`; uncaught exceptions surface as 500
- **No persistence**: the API is stateless — no database, no sessions stored server-side

Full diagrams and flows: `docs/architecture.md`.
