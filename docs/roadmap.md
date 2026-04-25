# Roadmap

## Current phase: Stabilization → Polish

The in-house packing pipeline and 3D frontend renderer are live. The backend was fully rewritten from NestJS/BinPackingJS to ASP.NET Core (.NET 10) with an eleven-stage pipeline implementing the Extreme Points heuristic (Crainic et al. 2008).

### Done (2026-04 session)

**Backend**
- Clean Architecture on ASP.NET Core minimal API (.NET 10 / C# 13)
- Eleven-stage PackingPipeline (Extreme Points heuristic, stability validation, compaction)
- New input fields: `accessCorner` (4 floor corners), `exitCorridor` (AABB), `weight` per box
- RFC 7807 exception handler for domain errors (ArgumentException → 422)
- Structured logging in PackingPipeline and PositionFinderStage
- Empty `boxes` array now rejected with 400
- Dead ConstraintsDto fields removed (Stackable, MustBeAccessible, SwitchZforY)
- Production Dockerfile verified (backend + frontend + nginx)
- `docker-compose.prod.yml` added
- 107 backend tests (Domain 34, Application 63, Api 10) — 0 failures
- FsCheck property tests for corner-flip roundtrip (40,000 random cases across 4 corners)

**Algorithm improvements**
- Two-phase AreaSelector: flat areas (height ≤ 20 cm) receive flat items first, then FFD
- Compactor: binary search replaces O(distance) step loop → ~200,000× speedup on large moves
- PositionFinder: EP pre-filter before AABB construction
- Stability: support surface cache (BuildSupportSurface) — O(1) Y-level lookup per EP
- LayerSlicer: skip layers with insufficient headroom

**Frontend**
- Fixed box overlap bug: renderer now uses `rotatedSize` from response
- Fixed inner bbox wireframe position for flipped access corners
- Karma specs: InputPanelService (13 cases), Area.class (4 cases), ProcessorService (5 cases)
- Demo simplified: all areas use BottomFrontLeft so boxes visibly pack from the left corner

### 3D scene gizmos (2026-04-25)

- `camera-controls` v3 replaces OrbitControls: smooth animated `fitToBox`, `reset`, `setLookAt` transitions on F / H / 1-9
- FlyControls walk-through mode (`` ` `` toggle, `Esc` to exit); blue badge while active; blocks hover/click during flight
- `EffectComposer` pass chain: GTAOPass (ambient occlusion) → UnrealBloomPass → OutlinePass×2 (selected white / hovered grey) → SMAAPass; AO and Bloom toggleable from Graphics panel (persisted)
- `TransformControls`: drag/rotate selected box (G = translate, R = rotate)
- `SelectionBox` + `SelectionHelper`: Shift + drag rubber-band for multi-select
- `Box3Helper` on selected box + 3× `ArrowHelper` (yellow W/H/D dimension arrows from min corner)
- `Box3Helper` per fitted area showing packed-items bounding box (O key)
- `LabelManagerService`: CSS2DRenderer HTML labels over every box (L key)
- Clipping plane with `PlaneHelper` and live Y slider in Graphics panel (C key)
- Screenshot button in header (`AppEvent.SCREENSHOT` → `renderer.toDataURL()` download)
- Stats.js FPS overlay toggled from Graphics panel
- Keyboard shortcuts panel updated with all 12 new shortcuts

### Known gaps / not started

- CI/CD pipeline (`.github/workflows/`) — explicitly out of scope until requested
- JWT auth not enforced on `POST /organize/sort` (public)
- Karma/Chrome sandbox issue on macOS Sequoia — specs compile but cannot auto-run

## Decisions log

| Date | Decision | Reason |
|---|---|---|
| 2026-04 | Replace NestJS + BinPackingJS with ASP.NET Core + in-house pipeline | BinPackingJS lacked stacking constraints, accessCorner, exitCorridor, and weight-based sorting |
| 2026-04 | Corner enum reduced to 4 floor corners only | Top corners duplicate bottom behaviour under gravity-up packing |
| 2026-04 | PositionFinder lex order changed to (Y, Z, X) | Bug: previous (Z, X, Y) stacked vertically before filling the floor |
| 2026-04 | NestJS deleted directly, no feature flag | User decision: direct replacement, no parallel-run period |
| 2026-04 | DTOs kept as manual mirrors (TS ↔ C#) | Cost of wiring openapi-typescript exceeded maintaining two ~30-line files |
| 2026-04 | Compactor uses binary search for push distance | O(distance) step loop was the primary performance bottleneck |
| 2026-04 | Two-phase AreaSelector with flat-area affinity | FFD alone routed flat items (comics, art books) to the main shelf instead of the flat drawer |
| — | Three.js for frontend 3D rendering | De-facto standard for web 3D |
| — | No DB (stateless API) | Sorting is pure computation — no persistence needed |
