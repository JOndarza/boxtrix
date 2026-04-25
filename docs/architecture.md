# Architecture

## Overview

BoxTrix follows a **Clean Architecture** split into two independent applications that communicate over HTTP.

```
frontend/ (Angular + Three.js)
    └── HTTP POST /organize/sort
backend/ (ASP.NET Core minimal API on .NET 10)
    └── BoxTrix.Api ──► BoxTrix.Application ──► BoxTrix.Domain
                          (PackingPipeline)
```

## Backend structure

### Solution layout

```
backend/
├── BoxTrix.sln
├── Directory.Build.props
├── src/
│   ├── BoxTrix.Domain/
│   │   ├── Enums/                 (Rotation, Corner, Units)
│   │   ├── ValueObjects/          (Position, Measurements, Aabb)
│   │   ├── Entities/              (Box, Area, ExitCorridor, PlacedBox, OrganizedArea)
│   │   ├── Functions/             (GeometryFunctions — rotate, support, AABB)
│   │   └── Contracts/             (IPipelineStage marker)
│   │
│   ├── BoxTrix.Application/
│   │   ├── DependencyInjection.cs
│   │   └── Pipeline/
│   │       ├── PackingPipeline.cs        (orchestrator + IPacker)
│   │       ├── PipelineRequest.cs / PipelineResponse.cs (decimal-space)
│   │       ├── NormalizedRequest.cs / AreaContext.cs / Layer.cs
│   │       └── Stages/  (eleven specialised classes)
│   │
│   └── BoxTrix.Api/
│       ├── Program.cs
│       ├── Endpoints/             (OrganizeEndpoints — MapPost("/organize/sort", …))
│       ├── Dtos/                  (InputDto, OutputDto, Mappers)
│       └── Validators/            (FluentValidation rules per DTO)
│
└── tests/  (Domain.Tests, Application.Tests, Api.Tests)
```

### Domain layer — invariants

- `Position`/`Measurements` are scaled-integer (`long`) value objects produced by the `NormalizerStage` (×10^5)
- `DecimalPosition`/`DecimalMeasurements` are user-space (`decimal`) — produced by the `DenormalizerStage` and consumed by the API mapper
- `Aabb` overlap is half-open: two AABBs sharing a single face do **not** collide
- `GeometryFunctions.SupportRatio` returns `[0, 1]`; the floor (y = 0) is always fully supported
- `Box.GravityKey = (Weight ?? 1) × Volume` — the sort key for bottom-up placement
- Domain has **zero** dependencies on Application or Api

### Application layer — the pipeline

The `PackingPipeline` orchestrator wires eleven stages registered as singletons. Every stage is a single-responsibility class so individual heuristics can be swapped without touching the rest.

| # | Stage | Responsibility |
|---|---|---|
| a | `NormalizerStage` | Validate input, scale decimal → `long` ×10^5, default missing weights |
| b | `AreaPreprocessorStage` | Map `Corner` to canonical (0,0,0), flip exit-corridor AABB into canonical space, resolve `MaxStackHeight` |
| c | `BoxSorterStage` | Stable sort: `weight × volume` desc → volume → max dim → id |
| d | `AreaSelectorStage` | Iterate areas largest-volume-first; per area run e..i; collect unfitted |
| e | `LayerSlicerStage` | Maintain Y layers bottom-up; open new layers on demand under `MaxStackHeight` |
| f | `RotationOptimizerStage` | Yield the six rotations ordered by base area desc, height asc (stability bias) |
| g | `PositionFinderStage` | **Extreme Points heuristic** (Crainic, Perboli, Tadei 2008). Picks lex-smallest EP `(z, x, y)` that satisfies bounds, no overlap, no forbidden region, height cap, stability |
| h | `StabilityValidatorStage` | Reject `y > 0` placements with support ratio below `MinSupportRatio` (default 0.7) or CoG outside the supporting polygon |
| i | `CompactorStage` | Greedy push toward origin: `-x` then `-z` then `-y`. Re-validates stability after each push |
| j | `UnfittedCollectorStage` | Build a synthetic `UNFITTED` area large enough for everything that did not fit; pack it through the same pipeline (no corridor, no cap, no stability) |
| k | `DenormalizerStage` | `÷ 10^5` and apply the inverse X/Z flip per area so coordinates are anchored to the user's chosen corner |

### Api layer

`Program.cs` wires DI (`AddBoxTrixApplication()`), CORS for `FRONTEND_ORIGIN`, JSON camelCase + string enums, and Swashbuckle for `/swagger`.

`OrganizeEndpoints.MapOrganizeEndpoints` registers `POST /organize/sort` returning `Ok<OutputDto>` or `ValidationProblem` (RFC 7807).

`Mappers` translate `InputDto ↔ PipelineRequest` and `PipelineResponse → OutputDto`. Application never sees the wire shape.

## Frontend layers (`frontend/src/app/`)

| Folder | Role |
|---|---|
| `components/` | Standalone UI components: `canvas` (Three.js scene), `sidebar`, `header`, `footer`, `layout/input-panel`, `layout/keyboard-help` |
| `common/api/` | Typed HTTP service (`OrganizeService extends ApiServiceBase`) |
| `common/classes/rendered/` | Three.js scene objects: `Area` (now carries `exitCorridor`), `Rendered`, `RenderedController`, `Project`, `Bases` |
| `common/dtos/` | Shared TypeScript interfaces mirroring backend contracts |
| `common/enums/` | `Rotation`, `Corner`, `Units` (mirror of backend enums) |
| `shared/services/` | Cross-feature: `ProcessorService`, `ContextService`, `EventsService`, `RewindManagerService`, `FocusManagerService`, `TextManagerService`, `ConstantsService`, `ThemeService`, `GraphicsService`, `KeyboardHelpService`, `InputPanelService`, `SceneService` (component-scoped WebGL owner), `LabelManagerService` (component-scoped CSS2DRenderer) |

## Data flow

```
User input (input-panel)
  → InputPanelService.buildInput()           (form rows → IInput)
  → ProcessorService.sort()
  → POST /organize/sort                      (HTTP via OrganizeService)
  → BoxTrix.Api.OrganizeEndpoints.Sort
      ├─► InputValidator (FluentValidation)
      ├─► Mappers.ToPipelineRequest
      ├─► PackingPipeline.Pack            ─── stages a..k
      └─► Mappers.FromPipelineResponse
  → IOutput returned
  → ProcessorService.handle() builds Project
  → ContextService stores it
  → AppEvent.RENDERING fired
  → CanvasComponent renders Three.js scene (drawContainer + drawExitCorridor + drawBox)
```

## Key patterns

- **DI (backend)**: services registered in `BoxTrix.Application/DependencyInjection.cs`; injected by type via constructor — no service-locator
- **Routing**: minimal API `MapPost("/organize/sort", …)`; auth not yet wired (public)
- **Algorithm precision**: `NormalizerStage` multiplies by 10^5; `DenormalizerStage` divides on the way out
- **Bottom-up gravity**: `BoxSorterStage` sorts by `Weight × Volume` desc so heavy items consume the floor first; combined with `LayerSlicer`, this produces a physically stable stack
- **Corner-anchored packing**: `AreaPreprocessor` maps the user's `accessCorner` to (0, 0, 0); the `Denormalizer` mirrors X/Z so user-space coordinates remain anchored to the chosen corner
- **Forbidden regions**: `IArea.exitCorridor` (AABB) is honoured by the `PositionFinder`; the frontend renders it as a translucent red mesh
- **Unfitted boxes**: never silently dropped — they go to a virtual `UNFITTED` area with `unplaced = true`
- **Frontend events**: `AppEvent` enum (`LOADING`, `LOADED`, `RENDERING`, `RENDERED`, `RAYCAST`, `CLICKED`, `SCREENSHOT`); `EventsService` provides typed `Subject<T>` per event
- **3D selection**: `FocusManagerService.set()` fires `AppEvent.RAYCAST`; the sidebar subscribes to highlight the matching list item; `AppEvent.SCREENSHOT` is fired from `HeaderComponent` and consumed by `CanvasComponent`
- **User preferences**: `ThemeService` and `GraphicsService` use `signal()` + inline `localStorage`; never `StorageService` for preferences; `showAO` and `showBloom` are persisted; `showStats`, `clippingEnabled`, `clippingY` are session-only
- **WebGL quality**: `SceneService.setPixelRatio` / `setToneMapping` apply runtime renderer changes; `CanvasComponent` wires `GraphicsService` signals via `effect()` guarded by `_sceneReady`
- **EffectComposer pass chain**: `RenderPass → GTAOPass (optional) → UnrealBloomPass (optional) → OutlinePass×2 (selected / hovered) → SMAAPass`; composer replaces the direct `renderer.render()` call
- **Camera controls**: `camera-controls` v3 (`@yomotsu`) replaces `OrbitControls`; `SceneService` exposes `animateTo`, `fitToBox`, `saveCameraState`, `resetCamera`, `syncCameraState`; `ViewportGizmo` attaches to the same instance; `FlyControls` activates on `` ` `` and suspends `CameraControls` while active
- **CSS2D labels**: `LabelManagerService` owns a `CSS2DRenderer` overlay (absolute-positioned over the WebGL canvas); `SceneService.afterRender` callback renders it every frame; `SceneService.onFrame(delta)` callback runs `FlyControls.update(delta)` when fly mode is active

## Dependency rules

- Domain has **zero** dependencies on Application, Api, or third parties beyond the BCL
- Application references Domain only
- Api references Domain + Application
- Frontend components never call `HttpClient` directly — always through `common/api/` services

## Error handling

- Validation failures return RFC 7807 `ValidationProblem` (HTTP 400) via `TypedResults.ValidationProblem`
- Uncaught exceptions surface as 500 via the default ASP.NET Core handler
- TODO: typed problem details for domain-level errors (`UnreachableCorner`, `UnsupportedRotation`, etc.)

## UI patterns

### Input panel — extended fields (2026-04-24)

| Field | Where | Notes |
|---|---|---|
| `accessCorner` | per area row | Select with the four floor corners; default `BottomFrontLeft` |
| `exitCorridor` | per area, expandable sub-row | AABB (`x, y, z, width, height, depth`) marking a forbidden region |
| `weight` (kg) | per box row | Optional; falls back to volume when missing |

### Canvas — exit corridor rendering

`CanvasComponent.drawExitCorridor(parent, area)` adds a translucent red mesh + wireframe inside the area container when `area.exitCorridor` is present. Coordinates are area-local; the parent transform (centred at zero) is taken into account.
