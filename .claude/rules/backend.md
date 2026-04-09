---
paths:
  - "backend/**/*.ts"
---

<!-- mirrors: docs/architecture.md, docs/coding-rules.md -->

# Backend rules (auto-load on backend/ file match)

- **Layer rule**: API → Application → Domain. Never import Domain from API directly; never skip layers
- **IoC**: all services must have `@injectable()`. Inject via `@inject(SymbolXxx)` in constructor. All bindings are singleton
- **New endpoints**: add a `ModuleBase` subclass, register in `APIApp.configureRoutes()`, wire IoC symbol in the relevant `*.ioc.ts` container
- **JWT**: `checkJWT = true` by default. Public endpoints must explicitly pass `false`
- **Algorithm precision**: BinPackingJS uses integers — multiply inputs by `10^5`, divide results by `10^5` after packing
- **Unfitted boxes**: always surface them — collect into a virtual `UNFITTED` area, never silently discard
- **Error handling**: `ModuleBase` catches errors and returns `undefined`; improve with typed responses when working in this area
- **Path aliases**: use `@api/*`, `@application/*`, `@domain/*`, `@transversal/*`, `@environment/*` — no deep relative imports

Full reference: `docs/architecture.md`, `docs/coding-rules.md`.
