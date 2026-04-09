# Tech Stack

<!-- auto-generated from codebase scan -->

## Backend (`backend/`)

| Package | Version | Purpose |
|---|---|---|
| Node.js | ≥22 (inferred from `@types/node ^22`) | Runtime |
| TypeScript | ^5.6.3 | Language |
| Express | ^4.21.1 | HTTP server |
| InversifyJS | ^6.0.2 | IoC / dependency injection |
| reflect-metadata | ^0.2.2 | Required for InversifyJS decorators |
| binpackingjs | ^3.0.2 | 3D bin packing algorithm |
| jsonwebtoken | ^9.0.2 | JWT auth |
| cors | ^2.8.5 | CORS middleware |
| helmet | ^8.0.0 | Security headers |
| compression | ^1.7.4 | Response compression |
| morgan | ^1.10.0 | HTTP request logger |
| dotenv | ^16.4.5 | Env var loading |
| rxjs | ^7.8.1 | Reactive utilities |
| lodash | ^4.17.21 | Data utilities |
| node-fetch | ^3.3.2 | HTTP client (used by HTTPService) |
| uuid | ^10.0.0 | UUID generation |
| errorhandler | ^1.5.1 | Dev error handler middleware |

### Dev tooling (backend)
| Package | Version | Purpose |
|---|---|---|
| webpack | ^5.95.0 | Bundler |
| ts-loader | ^9.5.1 | TypeScript webpack loader |
| nodemon | ^3.1.7 | Dev server auto-reload |
| eslint | 8.56.0 | Linter |
| prettier | 3.3.3 | Formatter |
| tsconfig-paths | ^4.2.0 | Path alias resolution |

### Build
- **Dev**: `nodemon` + `ts-node` with `tsconfig-paths`
- **Prod**: `webpack --config webpack.api.js` → bundled output in `dist/`
- **Path aliases**: `@api/*`, `@application/*`, `@domain/*`, `@transversal/*`, `@environment/*` (configured in `tsconfig.json`)

## Frontend (`frontend/`)

| Package | Version | Purpose |
|---|---|---|
| Angular | ^18.2.0 | Framework |
| TypeScript | ~5.5.2 | Language |
| Three.js | ^0.168.0 | 3D rendering |
| @ng-icons/core | ^29.5.0 | Icon system |
| @ng-icons/material-icons | ^29.5.0 | Material icon set |
| rxjs | ~7.8.0 | Reactive state/events |
| lodash | ^4.17.21 | Data utilities |
| randomcolor | ^0.6.2 | Random color generation |
| zone.js | ~0.14.10 | Angular change detection |

### Dev tooling (frontend)
| Package | Version | Purpose |
|---|---|---|
| @angular/cli | ^18.2.1 | Build + serve |
| karma | ~6.4.0 | Test runner |
| jasmine-core | ~5.2.0 | Test framework |
| karma-chrome-launcher | ~3.2.0 | Chrome test runner |
| karma-coverage | ~2.2.0 | Coverage reporting |

## Environment variables

| Var | Used by | Description |
|---|---|---|
| `PORT` | backend | Express server port (default: 4200) |
| `ORIGIN` | backend | TODO: verify usage |
| `FRONTEND_ORIGIN` | backend | Allowed CORS origin (e.g. `http://localhost:4100`) |
| `OPEN_IA_KEY` | backend | OpenAI API key (planned, AIService not yet implemented) |
| `SERVER_JWT_PASS` | backend | JWT signing secret (default: `"JWT"`) |
