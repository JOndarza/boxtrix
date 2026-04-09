<!-- mirrors: docs/architecture.md -->

# Architecture — key patterns

- **Style**: Clean Architecture — Domain ← Application ← API. Never skip layers; API never imports Domain directly
- **Dependency rule**: Domain has zero external dependencies. Application depends on Domain only
- **IoC**: InversifyJS singleton container. Registered in `domain.ioc.ts` and `application.ioc.ts` at startup
- **Routing**: `ModuleBase` maps `{module.endpoint}/{method}` to service calls via `get()`/`post()` helpers
- **JWT guard**: `checkJWT = true` by default on new endpoints; `false` must be explicit
- **Algorithm**: BINPACKINGJSService processes areas largest-volume-first; unfitted boxes → virtual `UNFITTED` area
- **Frontend**: Angular services layer (`common/api/`, `shared/services/`) mediates all HTTP; Three.js objects in `common/classes/rendered/`
- **Error handling**: `try/catch` in `ModuleBase`; errors logged, response is `undefined`. Typed errors: TODO
- **No persistence**: the API is stateless — no database, no sessions stored server-side

Full diagrams and flows: `docs/architecture.md`.
