<!-- mirrors: docs/architecture.md -->

# Architecture — key patterns

- **Style**: Clean Architecture — Domain ← Feature Module (HTTP + service collapsed). Domain never depends on outer layers
- **NestJS modules**: one feature module per domain concept. `OrganizeModule` owns `OrganizeController` + `OrganizeService` + `BINPACKINGJSService`
- **DI**: NestJS resolves providers by class type — no Symbols, no `@inject()`. Add services to the module's `providers` array
- **Routing**: `@Controller('organize')` + `@Post('sort')` → path is `{controller}/{method}` (e.g. `/organize/sort`)
- **JWT guard**: not yet wired to `POST /organize/sort` (public). Add `@UseGuards(JwtGuard)` when authentication is needed
- **Algorithm**: `BINPACKINGJSService` processes areas largest-volume-first; unfitted boxes → virtual `UNFITTED` area; inputs scaled by `10^5` for integer packing
- **Frontend**: Angular services layer (`common/api/`, `shared/services/`) mediates all HTTP; Three.js objects in `common/classes/rendered/`
- **Components**: all Angular components are standalone; imported directly in `AppComponent`
- **Error handling**: NestJS built-in exception filter handles unhandled errors. TODO: introduce typed `HttpException` responses
- **No persistence**: the API is stateless — no database, no sessions stored server-side

Full diagrams and flows: `docs/architecture.md`.
