# API Contracts

<!-- auto-generated from codebase scan -->

## Base URL

- **Dev**: `http://localhost:4200`
- **Frontend origin allowed**: `http://localhost:4100`

## Auth

JWT via `Authorization` header. Endpoints have `checkJWT` flag — see per-endpoint notes.

```
Authorization: <jwt-token>
```

JWT payload structure:
```json
{
  "idSession": "string",
  "ip": "string"
}
```

JWT secret: `SERVER_JWT_PASS` env var (fallback: `"JWT"`).

## Endpoints

### POST /organize/sort

Calculates 3D bin packing — places boxes optimally into storage areas.

**Auth**: none (public, `checkJWT = false`)

**Request body**: `IInput`

```typescript
{
  id: string;
  name?: string;
  detail?: string;
  areas: Array<{
    id: string;
    name?: string;
    detail?: string;
    width: number;
    height: number;
    depth: number;
    x: number;
    y: number;
    z: number;
    startPoint?: { x: number; y: number; z: number };
  }>;
  boxes: Array<{
    id: string;
    name?: string;
    detail?: string;
    width: number;
    height: number;
    depth: number;
    weight?: number;
  }>;
  constraints?: {
    units?: Units;           // enum: see Units.enum.ts
    stackable?: boolean;
    maxStackHeight?: number;
    mustBeAccessible?: boolean;
    switchZforY?: boolean;
  };
}
```

**Response**: `IOutput`

```typescript
{
  id: string;               // "algorithm_local"
  areas: Array<{
    id: string;
    name?: string;
    detail?: string;
    width: number;
    height: number;
    depth: number;
    x: number;
    y: number;
    z: number;
    unplaced: boolean;      // true = UNFITTED virtual area
    fixedMeans: { width: number; height: number; depth: number };
    boxes: Array<{
      id: string;
      name?: string;
      detail?: string;
      position: { x: number; y: number; z: number };
      rotation: Rotation;   // enum: see Rotation.enum.ts
    }>;
  }>;
}
```

**Notes**:
- Areas are processed largest-volume-first
- Boxes that don't fit any area are collected into a virtual area with `id: "UNFITTED"` and `unplaced: true`
- `fixedMeans` on each area contains the actual minimized container dimensions used by the algorithm (may be smaller than the declared area dimensions)
- Boxes within each area are sorted by proximity to the area's origin point

## CORS

Allowed origin: `FRONTEND_ORIGIN` env var. Methods: `GET`, `POST`. `credentials: true`.

## Allowed HTTP methods

`GET`, `POST` (as declared in CORS config). Current endpoints use `POST` only.
