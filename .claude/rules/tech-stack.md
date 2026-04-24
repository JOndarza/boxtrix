<!-- mirrors: docs/tech-stack.md -->

# Tech stack — hard constraints

- **Backend**: Node.js + NestJS ^11.1 / TypeScript ^5.9
- **Frontend**: Angular ^21.2 / TypeScript ~5.9 / Three.js ^0.183
- **Algorithm**: binpackingjs ^3.0 (3D bin packing — BP3D API)
- **DI (backend)**: NestJS built-in — `@Injectable()`, constructor injection by class type, providers array in `@Module()`
- **Auth**: JWT via `jsonwebtoken ^9.0` — `Authorization` header, `SERVER_JWT_PASS` env var
- **Icons (frontend)**: `@ng-icons` + Material Icons — never import SVGs directly
- **3D**: Three.js — scene objects in `frontend/src/app/common/classes/rendered/`
- **Prohibited**: do not introduce InversifyJS, MediatR, or any ORM (no DB in this project)
- **Dev tooling**: `nest build` (backend), Angular CLI 18 (frontend), nodemon + ts-node (backend dev)

Full package tables: `docs/tech-stack.md`.
