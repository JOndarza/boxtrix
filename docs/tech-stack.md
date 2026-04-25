# Tech Stack

## Backend (`backend/`)

ASP.NET Core minimal API targeting **.NET 10**, organised into a Clean Architecture solution (`BoxTrix.sln`).

### Projects

| Project | Path | Role |
|---|---|---|
| `BoxTrix.Domain` | `src/BoxTrix.Domain/` | Entities, value objects, enums, geometry. Zero external dependencies |
| `BoxTrix.Application` | `src/BoxTrix.Application/` | Pipeline + eleven specialised stages + DI registration |
| `BoxTrix.Api` | `src/BoxTrix.Api/` | Minimal API endpoints, DTOs, validators, OpenAPI |
| `BoxTrix.Domain.Tests` | `tests/BoxTrix.Domain.Tests/` | xUnit tests for value objects and geometry |
| `BoxTrix.Application.Tests` | `tests/BoxTrix.Application.Tests/` | xUnit tests for stages and the pipeline |
| `BoxTrix.Api.Tests` | `tests/BoxTrix.Api.Tests/` | xUnit + `WebApplicationFactory` integration tests |

### NuGet packages

| Package | Project | Purpose |
|---|---|---|
| `Microsoft.AspNetCore.OpenApi` (built-in) | Api | Endpoint descriptors |
| `Swashbuckle.AspNetCore` | Api | Swagger UI + OpenAPI schema generation |
| `FluentValidation.AspNetCore` | Api | Declarative DTO validation |
| `Microsoft.Extensions.DependencyInjection` | Application + tests | Built-in DI container |
| `xunit` / `xunit.runner.visualstudio` | tests | Test runner |
| `FluentAssertions` | tests | Readable assertions |
| `Microsoft.AspNetCore.Mvc.Testing` | Api.Tests | In-process HTTP test host |

### Build

- **Dev**: `dotnet watch --project src/BoxTrix.Api/BoxTrix.Api.csproj run`
- **Prod**: `dotnet publish src/BoxTrix.Api/BoxTrix.Api.csproj -c Release -o /app`
- **Tests**: `dotnet test`
- **Container (dev)**: `mcr.microsoft.com/dotnet/sdk:10.0` (see `backend/Dockerfile.dev`)
- **Container (prod)**: `mcr.microsoft.com/dotnet/aspnet:10.0` (see `backend/Dockerfile`)

### Solution-wide settings

- `backend/Directory.Build.props` — `TargetFramework=net10.0`, `Nullable=enable`, `TreatWarningsAsErrors=true`, `LangVersion=latest`
- `backend/.editorconfig` — formatting + analyzer severity overrides for tests

## Frontend (`frontend/`)

| Package | Version | Purpose |
|---|---|---|
| Angular | ^21.2.0 | Framework |
| TypeScript | ~5.9.2 | Language |
| Three.js | ^0.183.0 | 3D rendering (deferred chunk) |
| @angular/service-worker | 21.2.8 | PWA service worker (production only) |
| camera-controls | ^3.1.2 | WebGL camera |
| three-viewport-gizmo | ^2.2.0 | 3D orientation gizmo |
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
| `ASPNETCORE_URLS` | backend | Listening URL (default in dev: `http://0.0.0.0:4200`) |
| `ASPNETCORE_ENVIRONMENT` | backend | `Development` / `Production` |
| `FRONTEND_ORIGIN` | backend | Allowed CORS origin (e.g. `http://localhost:4400`) |

## Prohibited

- BinPackingJS — replaced by the in-house `PackingPipeline`. Do not reintroduce.
- ORMs and databases — the API is stateless.
- MediatR / Inversify / any other DI container — built-in `Microsoft.Extensions.DependencyInjection` is enough.
