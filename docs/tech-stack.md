# Tech Stack

## Backend (`backend/`)

| Package | Version | Purpose |
|---|---|---|
| Node.js | ≥22 | Runtime |
| TypeScript | ^5.6.3 | Language |
| NestJS | ^11.1 | Framework (HTTP, DI, modules) |
| reflect-metadata | ^0.2.2 | Decorator metadata (required by NestJS) |
| binpackingjs | ^3.0.2 | 3D bin packing algorithm |
| jsonwebtoken | ^9.0.2 | JWT auth |
| cors | ^2.8.5 | CORS middleware |
| helmet | ^8.0.0 | Security headers |
| compression | ^1.7.4 | Response compression |
| morgan | ^1.10.0 | HTTP request logger |
| dotenv | ^16.4.5 | Env var loading |
| rxjs | ^7.8.1 | Reactive utilities |
| uuid | ^10.0.0 | UUID generation |

### Dev tooling (backend)
| Package | Version | Purpose |
|---|---|---|
| @nestjs/cli | ^11.0 | Build (`nest build`) |
| ts-node | ^10.9.2 | Direct TS execution |
| nodemon | ^3.1.7 | Dev server auto-reload |
| tsconfig-paths | ^4.2.0 | Path alias resolution |
| eslint | 8.56.0 | Linter |
| prettier | 3.3.3 | Formatter |

### Build
- **Dev**: `nodemon --exec ts-node src/main.ts`
- **Prod**: `nest build` → compiled output in `dist/`
- **Path aliases**: `@domain/*`, `@organize/*`, `@environment/*` (configured in `tsconfig.json`)

## Frontend (`frontend/`)

| Package | Version | Purpose |
|---|---|---|
| Angular | ^21.2.0 | Framework |
| TypeScript | ~5.9.2 | Language |
| Three.js | ^0.183.0 | 3D rendering |
| @ng-icons/core | ^33.2.0 | Icon system |
| @ng-icons/material-icons | ^33.2.0 | Material icon set |
| rxjs | ~7.8.0 | Reactive state/events |
| randomcolor | ^0.6.2 | Random color generation |
| zone.js | ~0.14.10 | Angular change detection |

### Dev tooling (frontend)
| Package | Version | Purpose |
|---|---|---|
| @angular/cli | ^18.2.1 | Build + serve |
| karma | ~6.4.0 | Test runner |
| jasmine-core | ~5.2.0 | Test framework |

## Environment variables

| Var | Used by | Description |
|---|---|---|
| `PORT` | backend | Server port (default: 4200) |
| `FRONTEND_ORIGIN` | backend | Allowed CORS origin (e.g. `http://localhost:4100`) |
| `SERVER_JWT_PASS` | backend | JWT signing secret |
| `OPEN_IA_KEY` | backend | OpenAI API key (planned — AIService not yet implemented) |
