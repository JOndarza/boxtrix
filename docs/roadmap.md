# Roadmap

## Current phase: Foundation

The core bin packing algorithm (BINPACKINGJSService) and 3D frontend renderer (Three.js) are in place. The product is described as "COMING SOON!" — it is not publicly launched.

### Done
- Backend: Clean Architecture skeleton with Express + InversifyJS IoC
- Domain: BinPackingJS 3D bin packing algorithm integration
- API: `POST /organize/sort` endpoint (public, no auth required)
- Frontend: Angular 18 app with Three.js 3D scene, sidebar, header, footer
- Frontend: API client for the organize endpoint

### In progress
- TODO: verify with team

## Planned / known gaps
- `AIService`: defined and wired in IoC but not implemented — OpenAI integration planned
- Error handling: currently silent `undefined` response on errors — typed error responses needed
- Tests: no backend tests exist yet
- Frontend dev port conflict: both backend and frontend may default to port 4200
- No Docker setup
- No CI/CD pipeline

## Decisions log

| Date | Decision | Reason |
|---|---|---|
| — | BinPackingJS chosen for 3D bin packing | Pre-built algorithm, avoids custom geometry logic |
| — | Three.js for frontend 3D rendering | De-facto standard for web 3D |
| — | InversifyJS for IoC | TypeScript-native IoC with decorator support |
| — | No DB (stateless API) | Sorting is a pure computation — no persistence needed |
