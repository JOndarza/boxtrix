# Deployment

<!-- auto-generated from codebase scan -->

## Development

### Backend

```bash
cd backend
npm install
npm start          # nodemon + ts-node, watches for changes
```

Default port: `4200` (or `PORT` env var)

Required env vars (create `backend/.env`):
```
ORIGIN=http://localhost:4200
FRONTEND_ORIGIN=http://localhost:4100
OPEN_IA_KEY=<openai-key>
SERVER_JWT_PASS=<your-secret>
```

### Frontend

```bash
cd frontend
npm install
npm start          # ng serve
```

Default port: Angular CLI default (`4200` — but backend uses 4200 too, so check `angular.json` for the serve port)

### Running both
Start backend first (port 4200), then frontend. The frontend connects to the backend via the constant defined in `frontend/src/app/shared/services/contants.service.ts`.

## Production build

### Backend

```bash
cd backend
npm run build      # webpack --config webpack.api.js → dist/
```

### Frontend

```bash
cd frontend
npm run build      # ng build → dist/
```

## Notes

- No Docker configuration found in the repo — containerization is not yet set up
- No CI/CD pipeline found — TODO: verify
- `OPEN_IA_KEY` is present in `.env` but `AIService` is not yet implemented

## TODO: verify
- Actual frontend dev port (may conflict with backend's 4200)
- Production hosting target
- Whether a reverse proxy (nginx, etc.) is planned
