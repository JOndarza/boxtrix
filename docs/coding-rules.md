# Coding Rules

## General

- **Code language**: english — identifiers, comments, logs
- **Commits**: conventional format, imperative mood, no AI attribution
- **Comments**: explain *why*, not *what*. The code shows what
- **File size**: keep files focused; split when a file exceeds ~400 lines

## Naming conventions

| Context | Convention | Example |
|---|---|---|
| C# types | PascalCase | `OrganizeEndpoints`, `PackingPipeline` |
| C# interfaces | PascalCase prefixed with `I` | `IPacker`, `IPipelineStage` |
| C# methods / properties | PascalCase | `Pack`, `MaxStackHeight` |
| C# parameters / locals | camelCase | `request`, `minSupportRatio` |
| C# private fields | `_camelCase` | `_normalizer`, `_finder` |
| Enums (both languages) | PascalCase | `Rotation`, `Corner` |
| Enum values | PascalCase | `Rotation.WHD`, `Corner.BottomFrontLeft` |
| TypeScript interfaces | PascalCase prefixed with `I` | `IOrganizeService`, `IInput` |
| TypeScript classes / methods / vars | PascalCase / camelCase | `RenderedController`, `findBestFit` |
| Files (C#) | One public type per file; filename = type name | `PackingPipeline.cs`, `PositionFinderStage.cs` |
| Files (frontend) | PascalCase + descriptor suffix | `Organize.service.ts`, `canvas.component.ts` |
| Angular templates | `*.template.html` | `sidebar.template.html` |

## Backend rules

- **DI**: register stages and services in `BoxTrix.Application/DependencyInjection.cs`; resolve by type via constructor — no service-locator, no tokens
- **Stages**: live under `BoxTrix.Application/Pipeline/Stages/<Name>Stage.cs`; one stage per file; expose a single public method named after the responsibility (e.g. `Sort`, `Pack`, `Denormalize`)
- **Routing**: register endpoints in extension methods grouped by feature (e.g. `MapOrganizeEndpoints`); call from `Program.cs`
- **Validation**: every public DTO has a `FluentValidation.AbstractValidator<T>` registered as scoped; minimal API endpoints inject `IValidator<T>` and short-circuit with `TypedResults.ValidationProblem` on failure
- **JWT**: `POST /organize/sort` is currently public. Add `[Authorize]` (or `RequireAuthorization()`) to protect new endpoints when auth is wired up
- **Algorithm precision**: BoxTrix scales user dimensions by 10^5 to keep integer-exact arithmetic. `NormalizerStage` scales in, `DenormalizerStage` scales out
- **Warnings**: solution treats warnings as errors (`Directory.Build.props`); fix root causes rather than suppressing
- **Nullability**: Nullable Reference Types are enabled solution-wide. Don't sprinkle `!` to silence the compiler — guard or restructure

## Frontend rules

- **HTTP calls**: always use typed service classes. Never call `HttpClient` directly from components
- **3D scene**: Three.js objects live in `common/classes/rendered/`
- **Services scope**: `shared/services/` for cross-feature services, `common/services/` for shared utilities
- **Standalone components**: all Angular components are standalone; each imports only what its template needs
- **Forms**: reactive forms only, never template-driven
- **API URL**: declared in `frontend/src/environment/environment.ts` (`originApi`); do not hardcode

## Testing

- **Framework (backend)**: xUnit + FluentAssertions. Tests live in `backend/tests/<ProjectName>.Tests/`
- **Framework (frontend)**: Karma + Jasmine (configured in `angular.json`)
- **Naming (backend)**: `Method_does_something_under_condition` (snake-cased) so the failing-test report reads as a sentence
- **Naming (frontend)**: `should <Outcome> when <Condition>`
- **Structure**: Arrange / Act / Assert with blank lines between blocks
- **Mocks**: mock external IO only (HTTP, file system). Never mock pure functions, value objects, or stages — pipeline stages are plain singletons, instantiate them directly
- **Async**: always `await`. Never `.Result` or `.Wait()` in C#; never sync `subscribe` in TypeScript

## TypeScript config

### Frontend (`frontend/tsconfig.json`)

- `strict: true`, `experimentalDecorators: true`
- Target: `ES2022`, module: `ES2022`

## C# config

### Solution-wide (`backend/Directory.Build.props`)

- `TargetFramework=net10.0`, `Nullable=enable`, `ImplicitUsings=enable`, `LangVersion=latest`
- `TreatWarningsAsErrors=true`, `EnforceCodeStyleInBuild=true`
