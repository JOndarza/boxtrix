# Coding Rules

<!-- auto-generated from codebase scan -->

## General

- **Code language**: english — identifiers, comments, logs
- **Commits**: conventional format, imperative mood, no AI attribution
- **Comments**: explain *why*, not *what*. The code shows what
- **File size**: keep files focused; split when a file exceeds ~400 lines

## Naming conventions

| Context | Convention | Example |
|---|---|---|
| Classes | PascalCase | `OrganizeService`, `APIBase` |
| Interfaces | PascalCase prefixed with `I` | `IOrganizeService`, `IInput` |
| IoC symbols | PascalCase `Symbol<Name>` | `SymbolOrganizeService` |
| Methods / variables | camelCase | `configureRoutes`, `findBestFit` |
| Enums | PascalCase | `Rotation`, `Units` |
| Enum values | PascalCase | `Rotation.NoRotation` |
| Files (backend) | PascalCase + descriptor suffix | `Organize.service.ts`, `module.base.ts` |
| Files (frontend) | PascalCase + descriptor suffix | `Organize.service.ts`, `canvas.component.ts` |
| Angular templates | `*.template.html` | `sidebar.template.html` |

## Backend rules

- **IoC**: all services must be decorated with `@injectable()`. Inject via `@inject(Symbol)` in constructors
- **Singletons**: all IoC bindings are `inSingletonScope()`
- **Module endpoints**: path format is `{module.endpoint}/{method}` — e.g. `/organize/sort`
- **JWT**: default for new endpoints is `checkJWT = true`. Public endpoints must explicitly pass `false`
- **Algorithm precision**: BinPackingJS uses integers — multiply by `10^5` before packing, divide after
- **Error handling (current)**: `try/catch` in `ModuleBase`; `console.error` + returns `undefined`. TODO: typed error responses

## Frontend rules

- **HTTP calls**: always use typed service classes. Never call `HttpClient` directly from components
- **3D scene**: Three.js objects live in `common/classes/rendered/`
- **Services scope**: `shared/services/` for cross-feature services, `common/services/` for shared utilities
- **Forms**: reactive forms only, never template-driven
- **API path**: frontend connects to backend at the URL declared in `common/services/contants.service.ts`

## Testing

- **Framework (backend)**: TODO: no tests found — framework not yet defined
- **Framework (frontend)**: Karma + Jasmine (configured in `angular.json`)
- **Naming**: `Should_<Outcome>_When_<Condition>` for test methods
- **Structure**: Arrange / Act / Assert with blank lines between blocks
- **Mocks**: mock external IO only (HTTP). Never mock pure functions or value objects
- **Async**: always `await`. Never `.Result` or `.Wait()`

## TypeScript config

### Backend (`tsconfig.json`)
- `strict: true`, `experimentalDecorators: true`, `emitDecoratorMetadata: true` (required for InversifyJS)
- `esModuleInterop: true`, `resolveJsonModule: true`
- Path aliases: `@api/*`, `@application/*`, `@domain/*`, `@transversal/*`, `@environment/*`

### Frontend (`tsconfig.json`)
- `strict: true`, `experimentalDecorators: true`
- Target: `ES2022`, module: `ES2022`
