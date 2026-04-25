# BoxTrix

3D space optimizer for collectible-product boxes. Calculates the optimal placement of empty boxes inside storage areas using an in-house pipeline of specialised algorithms (Extreme Points + layer slicing + stability validation), and renders the result via Three.js.

## Stack

- **Backend**: ASP.NET Core minimal API on .NET 10 (`backend/`)
- **Frontend**: Angular + Three.js (`frontend/`)
- **Algorithm**: in-house `PackingPipeline` — eleven specialised stages, see [`docs/architecture.md`](docs/architecture.md)

## Running locally

### Docker (recommended)

```sh
docker compose -f docker-compose.dev.yml up
```

- Backend: <http://localhost:4200>
- Frontend: <http://localhost:4400>
- Swagger: <http://localhost:4200/swagger>

### Without Docker

Backend (in `backend/`):

```sh
dotnet watch --project src/BoxTrix.Api/BoxTrix.Api.csproj run
```

Frontend (in `frontend/`):

```sh
npm install
npm start
```

## Tests

```sh
# Backend
cd backend && dotnet test

# Frontend
cd frontend && npm test
```

## API contract

`POST /organize/sort` — request body matches the TypeScript `IInput` interface in [`frontend/src/app/common/dtos/Input.interface.ts`](frontend/src/app/common/dtos/Input.interface.ts). Each area accepts an optional `accessCorner` (one of the four floor corners) and an optional `exitCorridor` AABB to mark a forbidden region. Boxes accept an optional `weight` so heavier boxes settle on the floor first.

Example:

```json
{
  "id": "demo",
  "areas": [{
    "id": "shelf", "width": 100, "height": 50, "depth": 40, "x": 0, "y": 0, "z": 0,
    "accessCorner": "BottomFrontRight",
    "exitCorridor": { "x": 80, "y": 0, "z": 0, "width": 20, "height": 50, "depth": 40 }
  }],
  "boxes": [
    { "id": "a", "width": 20, "height": 20, "depth": 20, "weight": 1.5 },
    { "id": "b", "width": 15, "height": 10, "depth": 15, "weight": 3.0 }
  ]
}
```

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — solution layout, pipeline stages, data flow
- [`docs/tech-stack.md`](docs/tech-stack.md) — packages and tooling
- [`docs/coding-rules.md`](docs/coding-rules.md) — naming, style, testing conventions
- [`docs/api-contracts.md`](docs/api-contracts.md) — wire-level contract details
- [`CLAUDE.md`](CLAUDE.md) — Claude Code guardrails for this repo
