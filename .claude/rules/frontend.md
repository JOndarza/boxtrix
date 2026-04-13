---
paths:
  - "frontend/**/*.ts"
  - "frontend/**/*.html"
  - "frontend/**/*.scss"
---

<!-- mirrors: docs/architecture.md, docs/coding-rules.md -->

# Frontend rules (auto-load on frontend/ file match)

- **HTTP**: never call `HttpClient` from components — always use typed service classes in `common/api/` or `shared/services/`
- **3D objects**: Three.js scene entities live in `common/classes/rendered/`. Do not construct Three.js objects in components directly
- **Services layering**: `shared/services/` = cross-feature (Processor, Context, Events, RewindManager, FocusManager, TextManager); `common/services/` = generic utilities (communication, storage)
- **Icons**: use `@ng-icons` + Material Icons set. Never import SVGs directly
- **Forms**: reactive forms only, never template-driven
- **API constants**: backend URL lives in `shared/services/Constants.service.ts` — do not hardcode URLs elsewhere
- **Templates**: named `*.template.html` — not `*.component.html`

Full reference: `docs/architecture.md`, `docs/coding-rules.md`.
