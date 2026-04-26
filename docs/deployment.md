# Deployment

## Development

### Backend (.NET 10)

```bash
cd backend
dotnet watch --project src/BoxTrix.Api/BoxTrix.Api.csproj run
```

Default port: **4200**. Swagger UI: `http://localhost:4200/swagger`.

Required env vars (create `backend/.env`):
```
FRONTEND_ORIGIN=http://localhost:4100
```

CORS allows the single origin declared in `FRONTEND_ORIGIN`.

### Frontend (Angular)

```bash
cd frontend
npm install
npm start          # ng serve → http://localhost:4100
```

Default port: **4100** (configured in `angular.json` `serve.options.port`).

### Running both (Docker Compose)

```bash
docker compose -f docker-compose.dev.yml up
```

Force-recreate containers (use after config or Dockerfile changes):

```bash
docker compose -f docker-compose.dev.yml up --force-recreate
```

- Backend container: port 4200 (host) ← 4200 (container)
- Frontend container: port 4400 (host) ← 4100 (container)

### Running tests

```bash
# Backend — all three test projects
cd backend && dotnet test

# Individual test project
dotnet test backend/tests/BoxTrix.Domain.Tests
dotnet test backend/tests/BoxTrix.Application.Tests
dotnet test backend/tests/BoxTrix.Api.Tests

# Frontend (Karma/Jasmine)
cd frontend && npm test
```

## Production build

### Backend

```bash
docker build -t boxtrix-api backend/
```

The multi-stage Dockerfile compiles with `dotnet publish -c Release` and produces a minimal ASP.NET runtime image.

Smoke-test the image:
```bash
docker run -e FRONTEND_ORIGIN=http://localhost:4400 -p 4200:4200 boxtrix-api
curl -X POST http://localhost:4200/organize/sort \
  -H "Content-Type: application/json" \
  -d '{"id":"test","areas":[{"id":"A","width":50,"height":50,"depth":50,"x":0,"y":0,"z":0}],"boxes":[{"id":"B","width":10,"height":10,"depth":10}]}'
```

### Frontend

```bash
cd frontend && npx ng build --configuration=production
```

Output: `frontend/dist/orden-cajas/`.

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `FRONTEND_ORIGIN` | Yes | Allowed CORS origin for the Angular app |
| `ASPNETCORE_URLS` | No | Override listen URL (default: `http://0.0.0.0:4200` in Dockerfile) |

## Notes

- No CI/CD pipeline exists yet (`.github/workflows/` is absent). When added, the workflow should run `dotnet build + test` and `ng build` on push/PR.
- No production `docker-compose.prod.yml` yet — only `docker-compose.dev.yml`.
- JWT auth is wired in the stack but not enforced on `POST /organize/sort` (endpoint is public).
