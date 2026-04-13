# Coding Rules

## General

- **Code language**: english — identifiers, comments, logs
- **Commits**: conventional format, imperative mood, no AI attribution
- **Comments**: explain *why*, not *what*. The code shows what
- **File size**: keep files focused; split when a file exceeds ~400 lines

## Naming conventions

| Context | Convention | Example |
|---|---|---|
| Classes | PascalCase | `OrganizeService`, `BINPACKINGJSService` |
| Interfaces | PascalCase prefixed with `I` | `IOrganizeService`, `IInput` |
| Methods / variables | camelCase | `configureRoutes`, `findBestFit` |
| Enums | PascalCase | `Rotation`, `Units` |
| Enum values | PascalCase | `Rotation.WHD` |
| Files (backend) | PascalCase + descriptor suffix | `Organize.service.ts`, `organize.controller.ts` |
| Files (frontend) | PascalCase + descriptor suffix | `Organize.service.ts`, `canvas.component.ts` |
| Angular templates | `*.template.html` | `sidebar.template.html` |

## Backend rules

- **DI**: decorate services with `@Injectable()`. Inject by class type in constructors — no Symbols, no `@inject()`
- **Module providers**: add every injectable service to the `providers` array of its NestJS module
- **Routing**: path format is `{controller}/{method}` — e.g. `/organize/sort`
- **JWT**: `POST /organize/sort` is currently public. Add `@UseGuards(JwtGuard)` to protect new endpoints
- **Algorithm precision**: BinPackingJS uses integers — multiply by `10^5` before packing, divide after
- **Error handling**: NestJS exception filter handles unhandled errors. TODO: typed `HttpException` responses

## Frontend rules

- **HTTP calls**: always use typed service classes. Never call `HttpClient` directly from components
- **3D scene**: Three.js objects live in `common/classes/rendered/`
- **Services scope**: `shared/services/` for cross-feature services, `common/services/` for shared utilities
- **Standalone components**: all Angular components are standalone; each imports only what its template needs
- **Forms**: reactive forms only, never template-driven
- **API URL**: declared in `shared/services/Constants.service.ts` via `CommunicationService` — do not hardcode

## Testing

- **Framework (backend)**: TODO — no tests yet
- **Framework (frontend)**: Karma + Jasmine (configured in `angular.json`)
- **Naming**: `Should_<Outcome>_When_<Condition>` for test methods
- **Structure**: Arrange / Act / Assert with blank lines between blocks
- **Mocks**: mock external IO only (HTTP). Never mock pure functions or value objects
- **Async**: always `await`. Never `.Result` or `.Wait()`

## TypeScript config

### Backend (`tsconfig.json`)

- `strict: true`, `experimentalDecorators: true`, `emitDecoratorMetadata: true`
- `esModuleInterop: true`, `resolveJsonModule: true`
- Path aliases: `@domain/*`, `@organize/*`, `@environment/*`

### Frontend (`tsconfig.json`)

- `strict: true`, `experimentalDecorators: true`
- Target: `ES2022`, module: `ES2022`
