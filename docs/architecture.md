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
| `components/` | Standalone UI components: `canvas` (Three.js scene), `sidebar`, `header`, `footer`, `layout/wizard` (onboarding flow), `layout/loading-overlay`, `layout/input-panel`, `layout/keyboard-help` |
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
- **3D selection**: `FocusManagerService.set()` fires `AppEvent.RAYCAST`; the sidebar subscribes to highlight the matching list item and calls `scrollIntoView({ block: 'nearest' })` — fitted and unfitted items both participate; `AppEvent.SCREENSHOT` is fired from `HeaderComponent` and consumed by `CanvasComponent`
- **Sidebar step sync**: `SidebarComponent` subscribes to `RewindManagerService.updated` (debounced 50 ms) and scrolls to `[data-step="N"]` on each step change, keeping the active box visible without selecting it
- **Bundle splitting**: `CanvasComponent` (Three.js + post-processing) is loaded via Angular `@defer (on immediate)` — it lands in a separate lazy chunk (~990 KB), reducing the initial bundle from ~1.3 MB to ~440 KB. `GraphicsSettingsComponent`, `KeyboardHelpComponent`, and `StatsComponent` are deferred with `on idle`. Components still appear in `AppComponent.imports[]` so the Angular compiler can resolve them; the esbuild bundler detects they are only used in `@defer` blocks and emits them as separate chunks
- **PWA**: `@angular/service-worker` is enabled in production builds (`angular.json → serviceWorker: "ngsw-config.json"`). Asset caching uses `prefetch` strategy for the app shell (JS/CSS chunks) and `lazy` for the font JSON. The `organize/sort` API endpoint is covered with `freshness` strategy (network-first, 5 s timeout). SW is registered via `provideServiceWorker` with `registerWhenStable:30000` to avoid competing with WebGL init
- **User preferences**: `ThemeService` and `GraphicsService` use `signal()` + inline `localStorage`; never `StorageService` for preferences; `showAO` and `showBloom` are persisted; `showStats`, `clippingEnabled`, `clippingY` are session-only
- **WebGL quality**: `SceneService.setPixelRatio` / `setToneMapping` apply runtime renderer changes; `CanvasComponent` wires `GraphicsService` signals via `effect()` guarded by `_sceneReady`
- **EffectComposer pass chain**: `RenderPass → GTAOPass (optional) → UnrealBloomPass (optional) → OutlinePass×2 (selected / hovered) → SMAAPass`; composer replaces the direct `renderer.render()` call
- **Camera controls**: `camera-controls` v3 (`@yomotsu`) replaces `OrbitControls`; `SceneService` exposes `animateTo`, `fitToBox`, `saveCameraState`, `resetCamera`, `syncCameraState`; `ViewportGizmo` attaches to the same instance; `FlyControls` activates on `` ` `` and suspends `CameraControls` while active
- **CSS2D labels**: `LabelManagerService` owns a `CSS2DRenderer` overlay (absolute-positioned over the WebGL canvas); labels are step-aware — only the label for the box at `rewind.step` is shown (`label.visible`), all labels hide at `rewind.maxStep`; `checkVisibility` skips `CSS2DObject` instances so Three.js does not override label visibility; labels render as a flex row (color swatch + name) matching the sidebar item style; `SceneService.afterRender` callback renders it every frame
- **Onboarding wizard**: `WizardComponent` (full-screen overlay, 2 steps) replaces the former `WelcomeComponent`; step 1 — upload JSON via `ProcessorService.parseJson()` (local parse, no backend call); step 2 — full-screen `InputPanelComponent` embedded with a glossary panel on the right; "Run packing" dismisses the wizard; `LoadingOverlayComponent` (z-index 150) shows a spinner until `AppEvent.RENDERED` fires; demo bypasses the wizard entirely
- **Scene editor**: opening the `+` button from the header also shows the full-screen `InputPanelComponent` + glossary overlay (`app-scene-editor`, z-index 150); `HeaderComponent.toggleInputPanel()` pre-fills the form via `InputPanelService.loadFromInput(ProcessorService.lastInput())` so the current project's areas and boxes are immediately editable; `ProcessorService.lastInput` saves a `structuredClone` of the original `IInput` before UUID mutation on every `sort()` call
- **InputPanel full-screen mode**: `InputPanelService.wizardMode` signal switches the panel from a 360 px fixed sidebar (`ip-panel`) to a flex-fill embedded variant (`ip-panel--wizard`) with centered max-width 780 px body; `open()` and `toggle()` set `wizardMode = true` automatically; `close()` resets it
- **Statistics from backend**: `DenormalizerStage.ComputeStats()` calculates `availableVolume`, `occupiedVolume`, `unplacedVolume`, `wastedVolume`, `efficiencyPct`, `placedCount`, `unplacedCount` in decimal user-unit space and returns them in `OutputDto.Stats`; `StatsComponent` reads `project.stats.*` directly — no frontend derivation
- **UNFITTED area rendering**: backend's arbitrary virtual-area wireframe is hidden; a tight bounding box computed from item positions (`tightWire`) is drawn instead — it represents the real unplaced volume shown in the stats
- **Typography**: Roboto loaded via `<link rel="preconnect">` + `<link rel="stylesheet">` in `index.html` (parallel, not render-blocking); JetBrains Mono kept for numeric data readouts; base font-size scale bumped ~12 % across all components; global thin scrollbar (4 px, transparent until hover) defined once in `_reset.scss`
- **Weight units**: `InputPanelService.weightUnits` signal (`kg` / `lb`) is independent of the dimension units; `InputPanelComponent.weightUnit` computed signal drives both the column header and the weight input placeholder

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
