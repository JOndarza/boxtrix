<!-- mirrors: docs/tech-stack.md -->

# Tech stack — hard constraints

- **Backend**: Node.js + Express ^4.21 / TypeScript ^5.6 / InversifyJS ^6.0
- **Frontend**: Angular ^18.2 / TypeScript ~5.5 / Three.js ^0.168
- **Algorithm**: binpackingjs ^3.0 (3D bin packing — BP3D API)
- **IoC**: InversifyJS — `@injectable()` + `@inject(Symbol)` decorators, all singletons
- **Auth**: JWT via `jsonwebtoken ^9.0` — `Authorization` header, `SERVER_JWT_PASS` env var
- **HTTP (backend)**: node-fetch ^3.3 via `HTTPService`
- **Icons (frontend)**: `@ng-icons` + Material Icons — never import SVGs directly
- **3D**: Three.js — scene objects in `frontend/src/app/common/classes/rendered/`
- **Prohibited alternatives**: do not introduce MediatR, NestJS, or any ORM (no DB in this project)
- **Dev tooling**: webpack 5 (backend build), Angular CLI 18 (frontend build), nodemon (backend dev)

Full package tables: `docs/tech-stack.md`.
