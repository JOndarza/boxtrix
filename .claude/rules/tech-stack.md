<!-- mirrors: docs/tech-stack.md -->

# Tech stack — hard constraints

- **Backend**: ASP.NET Core minimal APIs on .NET 10 / C# 13
- **Frontend**: Angular ^21.2 / TypeScript ~5.9 / Three.js ^0.183
- **Algorithm**: in-house `PackingPipeline` (eleven specialised stages — Normalizer, AreaPreprocessor, BoxSorter, AreaSelector, LayerSlicer, RotationOptimizer, PositionFinder (Extreme Points / Crainic 2008), StabilityValidator, Compactor, UnfittedCollector, Denormalizer)
- **DI (backend)**: built-in `Microsoft.Extensions.DependencyInjection` — register stages in `BoxTrix.Application/DependencyInjection.cs`. No tokens, no Symbols, resolution by type
- **Validation**: FluentValidation per DTO (`BoxTrix.Api/Validators/`); minimal API endpoints inject `IValidator<T>`
- **OpenAPI**: Swashbuckle exposes `/swagger` in dev — keep DTOs camelCase JSON
- **Auth**: JWT planned, not yet wired to `POST /organize/sort` (public)
- **PWA**: `@angular/service-worker` 21.2.8 enabled in production via `angular.json serviceWorker: "ngsw-config.json"`; registered with `provideServiceWorker` in `app.config.ts`
- **Bundle splitting**: `CanvasComponent` + Three.js deferred with `@defer (on immediate)`; `GraphicsSettingsComponent`, `KeyboardHelpComponent`, `StatsComponent` deferred with `@defer (on idle)`; initial bundle ~440 KB (was ~1.3 MB)
- **Icons (frontend)**: `@ng-icons` + Material Icons — never import SVGs directly
- **3D**: Three.js — scene objects in `frontend/src/app/common/classes/rendered/`
- **Prohibited**: BinPackingJS (replaced by in-house pipeline), MediatR, any ORM (no DB in this project)
- **Dev tooling**: `dotnet watch run` (backend), Angular CLI (frontend), `dotnet test` (xUnit + FluentAssertions)
- **Container**: `mcr.microsoft.com/dotnet/sdk:10.0` for dev, `mcr.microsoft.com/dotnet/aspnet:10.0` for runtime

Full package tables: `docs/tech-stack.md`.
