# Architecture

<!-- auto-generated from codebase scan -->

## Overview

BoxTrix follows a **Clean Architecture** split into two independent applications that communicate over HTTP.

```
frontend/ (Angular 18 + Three.js)
    └── HTTP POST /organize/sort
backend/ (Node.js + Express + TypeScript)
    └── API Layer
        └── Application Layer
            └── Domain Layer
```

## Backend layers

### API Layer (`backend/src/api/`)
- **Entry point**: `APIApp extends APIBase` — bootstraps Express, attaches middlewares, registers modules
- **Modules**: `OrganizeModule` — declares endpoints by mapping HTTP verbs + IoC service symbols to handlers
- **Base classes**: `ModuleBase` provides `get()` / `post()` helpers with optional JWT guard; `APIBase` wires Express + middleware

### Application Layer (`backend/src/lib/application/`)
- **Services**: orchestrate domain operations. `OrganizeService.sort()` calls the algorithm and post-processes results (sorts boxes by proximity to area origin)
- **Interfaces**: `IOrganizeService` + its IoC symbol

### Domain Layer (`backend/src/lib/domain/`)
- **Algorithm**: `BINPACKINGJSService` wraps the BinPackingJS 3D bin packing library. Finds best fit per area, minimizes container dimensions by binary search on each axis
- **AI service**: `AIService` (planned, currently empty) — will call OpenAI via `HTTPService`
- **Interfaces**: `IOrganizeAlgorithmService`, `IAIService`, `IHTTPService`
- **Structures**: `IInput`, `IOutput`, `IBox`, `IArea`, `IOrganizedBox`, `IOrganizedArea`
- **Enums**: `Units`, `Rotation`

### Transversal (`backend/src/lib/transversal/`)
- **IoC container**: `IocContainer` wraps InversifyJS. All bindings are singleton. Registered at startup in `domain.ioc.ts` and `application.ioc.ts`

## Frontend layers (`frontend/src/app/`)

| Folder | Role |
|---|---|
| `components/` | UI components: `canvas` (Three.js 3D scene), `sidebar`, `header`, `footer` |
| `common/api/` | Typed API client services (`Organize.service`) |
| `common/services/` | Shared: `communication` (event bus), `storage` |
| `common/classes/rendered/` | Three.js scene objects: `Area`, `Rendered`, `Project`, `Bases` |
| `shared/services/` | `Processor`, `TextManager`, `Events`, `RewindManager`, `Context`, `FocusManager` |

## Data flow

```
User input (sidebar)
  → Processor.service
  → POST /organize/sort (HTTP)
  → BINPACKINGJSService.sort() — 3D bin packing per area
  → OrganizeService.sort() — sort boxes by proximity
  → IOutput returned
  → Three.js scene rendered (canvas component)
```

## Key patterns

- **IoC via InversifyJS**: all services resolved from a singleton container; `@injectable()` + `@inject()` decorators
- **Module routing**: endpoint path = `{module.endpoint}/{method}` (e.g. `/organize/sort`)
- **JWT auth**: optional per-endpoint. Current `POST /organize/sort` has `checkJWT = false` (public)
- **Algorithm precision fix**: BinPackingJS works with integers; inputs are multiplied by `10^5` then divided back to restore decimal precision
- **Unfitted boxes**: boxes that cannot fit any area are collected into a virtual `UNFITTED` area

## Dependency rules

- Domain has **zero** dependencies on other layers
- Application depends on Domain only
- API depends on Application (via IoC) and never touches Domain directly
- Transversal (IoC) is imported by API layer bootstrap only

## Error handling (current state)

- `try/catch` in `ModuleBase.get()` / `.post()` — catches errors, logs to `console.error`, returns `undefined` as JSON
- TODO: introduce typed error responses instead of silent `undefined`
