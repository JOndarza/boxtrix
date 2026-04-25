# Coding rules — global

- **Code language**: english — identifiers, comments, logs
- **C# naming**: `PascalCase` for types/methods/properties, `camelCase` for parameters/locals, `_camelCase` for private fields. Interfaces prefixed with `I`. Enum members `PascalCase`
- **TypeScript naming**: `PascalCase` for classes and interfaces (interfaces prefixed with `I`), `camelCase` for methods and variables, `PascalCase` for enums and their values
- **C# files**: one public type per file; filename matches type name. Stages live under `BoxTrix.Application/Pipeline/Stages/<Name>Stage.cs`
- **TypeScript files**: `<Name>.<descriptor>.ts` (e.g. `Organize.service.ts`, `canvas.component.ts`); Angular templates: `*.template.html`
- **File size**: split files over ~400 lines
- **DI (backend)**: stages and services are registered in `BoxTrix.Application/DependencyInjection.cs`. Inject by interface or concrete type via constructor — no service-locator
- **Error handling**: `ValidationProblem` for input errors; let unhandled exceptions surface to the default ASP.NET Core handler. TODO: typed problem details for domain errors
- **Comments**: explain *why*, never *what*
- **Commits**: conventional format, imperative mood, no AI attribution
- **C# warnings**: solution treats warnings as errors (`Directory.Build.props`); fix root causes rather than suppressing
- **Algorithm precision**: BoxTrix scales user dimensions by 10^5 to keep integer-exact arithmetic; `NormalizerStage` scales in, `DenormalizerStage` scales out
