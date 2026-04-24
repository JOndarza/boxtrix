# Architecture

## Overview

BoxTrix follows a **Clean Architecture** split into two independent applications that communicate over HTTP.

```
frontend/ (Angular 18 + Three.js)
    └── HTTP POST /organize/sort
backend/ (Node.js + NestJS + TypeScript)
    └── OrganizeModule
        ├── OrganizeController  (HTTP)
        ├── OrganizeService     (orchestration)
        └── BINPACKINGJSService (domain algorithm)
```

## Backend structure

### Entry point (`backend/src/main.ts`)
Bootstraps NestJS with Helmet, CORS, compression, and Morgan. Loads env vars via `configureVars()`.

### Root module (`backend/src/app.module.ts`)
Imports feature modules. Currently: `OrganizeModule`.

### Feature module (`backend/src/organize/`)

| File | Role |
|---|---|
| `organize.module.ts` | Declares providers: `OrganizeService`, `BINPACKINGJSService` |
| `organize.controller.ts` | `POST /organize/sort` — receives `IInput`, returns `IOutput` |
| `organize.service.ts` | Orchestrates the algorithm call; sorts result boxes by proximity to area origin |

### Domain layer (`backend/src/lib/domain/`)
Zero dependencies on outer layers. Contains only pure logic and interfaces.

| Path | Contents |
|---|---|
| `services/algorithms/BINPACKINGJS/` | `BINPACKINGJSService` — wraps BP3D, finds best fit per area by binary-searching minimum dimensions on each axis |
| `interfaces/structures/` | `IInput`, `IOutput`, `IBox`, `IArea`, `IOrganizedBox`, `IOrganizedArea`, `IMeasurements` |
| `functions/` | `getVolume()` — pure measurement utility |
| `enums/` | `Units`, `Rotation` |

### Environment (`backend/src/environment/vars.ts`)
Typed wrapper around `process.env`. `getVar()` returns `string | undefined`.

## Frontend layers (`frontend/src/app/`)

| Folder | Role |
|---|---|
| `components/` | Standalone UI components: `canvas` (Three.js scene), `sidebar`, `header`, `footer` |
| `common/api/` | Typed HTTP service (`OrganizeService extends ApiServiceBase`) |
| `common/services/` | Utilities: `CommunicationService` (API URL + auth), `StorageService` (localStorage) |
| `common/classes/rendered/` | Three.js scene objects: `Area`, `Rendered`, `RenderedController`, `Project`, `Bases` |
| `common/dtos/` | Shared TypeScript interfaces mirroring backend contracts |
| `shared/services/` | Cross-feature: `ProcessorService`, `ContextService`, `EventsService`, `RewindManagerService`, `FocusManagerService`, `TextManagerService`, `ConstantsService`, `ThemeService`, `GraphicsService` |

## Data flow

```
User input (sidebar)
  → ProcessorService.sort()
  → POST /organize/sort (HTTP via OrganizeService)
  → OrganizeController → OrganizeService → BINPACKINGJSService
  → IOutput returned
  → ContextService stores project
  → AppEvent.RENDERING fired
  → CanvasComponent renders Three.js scene
```

## Key patterns

- **NestJS DI**: services declared in `providers` array of the module; injected by class type in constructors
- **Routing**: `@Controller('organize')` + `@Post('sort')` → `/organize/sort`
- **JWT auth**: not yet wired on `POST /organize/sort` (public). Add `@UseGuards(JwtGuard)` when needed
- **Algorithm precision**: BinPackingJS requires integers — inputs multiplied by `10^5`, outputs divided back
- **Gravity sort**: items sorted by `weight ?? volume` descending before packing so heavier items land at lower Y
- **Unfitted boxes**: boxes that cannot fit any area are collected into a virtual `UNFITTED` area, never silently dropped
- **Frontend events**: `AppEvent` enum (`LOADING`, `LOADED`, `RENDERING`, `RENDERED`, `RAYCAST`, `CLICKED`) — `EventsService` provides typed `Subject<T>` per event
- **3D selection**: `FocusManagerService.set()` fires `AppEvent.RAYCAST` with the object id; `SidebarComponent` subscribes to highlight the matching list item
- **User preferences**: `ThemeService` and `GraphicsService` follow the same pattern — Angular `signal()` for state, direct `localStorage` for persistence (keys `boxtrix-theme` / `boxtrix-graphics`), `providedIn: 'root'`. Never use `StorageService` for preferences; keep persistence inline.
- **WebGL quality**: `SceneService` exposes `setPixelRatio(ratio)` and `setToneMapping(mode)` for runtime quality changes. `CanvasComponent` wires `GraphicsService` signals to these methods via `effect()` guarded by `_sceneReady`. Initial settings are applied imperatively in `ngOnInit` after `init()` so the first frame renders at the saved quality.

## Dependency rules

- Domain has **zero** dependencies on other layers
- Feature module (`organize/`) depends on Domain only
- Domain never imports from `organize/`
- Frontend components never call `HttpClient` directly — always through `common/api/` services

## Error handling

- NestJS built-in exception filter handles unhandled errors (500 by default)
- TODO: introduce typed `HttpException` responses for domain-level errors
