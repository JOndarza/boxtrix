---
paths:
  - "backend/src/api/**"
  - "backend/src/**/modules/**"
---

<!-- mirrors: docs/api-contracts.md -->

# API rules (auto-load on api/ or modules/ files)

- **Only endpoint**: `POST /organize/sort` — public (`checkJWT = false`), accepts `IInput`, returns `IOutput`
- **Route pattern**: `{module.endpoint}/{method}` — endpoint declared on `ModuleBase` subclass, method is service method name
- **New routes**: create a `ModuleBase` subclass → register in `APIApp.configureRoutes()` → add IoC binding
- **Auth default**: `checkJWT = true` on new endpoints; `false` must be explicit and documented
- **Responses**: all responses are JSON via `response.json(data)`. On error: `undefined` (TODO: type this)
- **CORS**: only `FRONTEND_ORIGIN` env var is allowed. Methods: `GET`, `POST`. Do not add other origins without approval
- **No versioning yet**: no `/api/v1/` prefix currently — add versioning before introducing breaking changes

Full reference: `docs/api-contracts.md`.
