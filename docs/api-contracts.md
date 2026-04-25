# API Contracts

## Base URL

- **Dev (local)**: `http://localhost:4200`
- **Dev (Docker Compose)**: `http://localhost:4200` (backend container)
- **Swagger UI**: `http://localhost:4200/swagger` (development only)

## Auth

JWT is wired but **not currently enforced** on any endpoint. `POST /organize/sort` is public.

## Endpoints

### POST /organize/sort

Runs the packing pipeline and returns the optimal placement of boxes inside areas.

**Auth**: none (public)

**Request body**

```json
{
  "id": "string",
  "name": "string | null",
  "detail": "string | null",
  "areas": [
    {
      "id": "string",
      "name": "string | null",
      "detail": "string | null",
      "width": 120,
      "height": 40,
      "depth": 35,
      "x": 0,
      "y": 0,
      "z": 0,
      "accessCorner": "BottomFrontLeft",
      "exitCorridor": {
        "x": 0, "y": 0, "z": 0,
        "width": 30, "height": 40, "depth": 35
      },
      "maxStackHeight": 80
    }
  ],
  "boxes": [
    {
      "id": "string",
      "name": "string | null",
      "detail": "string | null",
      "width": 14,
      "height": 19,
      "depth": 10,
      "weight": 0.3
    }
  ],
  "constraints": {
    "units": "cm",
    "maxStackHeight": 80,
    "minSupportRatio": 0.7
  }
}
```

**Field notes**

| Field | Required | Default | Description |
|---|---|---|---|
| `areas[].accessCorner` | No | `BottomFrontLeft` | Floor corner where packing origin anchors. Values: `BottomFrontLeft`, `BottomFrontRight`, `BottomBackLeft`, `BottomBackRight`. |
| `areas[].exitCorridor` | No | none | AABB region that must stay clear (e.g., access path). Must fit inside the area bounding box. |
| `areas[].maxStackHeight` | No | none | Per-area stack height cap in user units. Overrides `constraints.maxStackHeight`. |
| `boxes[].weight` | No | none | Box weight in kg. Heavier boxes are sorted first (bottom layer priority). |
| `constraints.units` | No | `cm` | Unit system: `cm`, `in`, or `mm`. |
| `constraints.maxStackHeight` | No | none | Global stack height cap. Per-area value takes precedence. |
| `constraints.minSupportRatio` | No | `0.7` | Minimum fraction of a box's base that must be supported (0–1). |

**Response body**

```json
{
  "id": "string",
  "name": "string | null",
  "detail": "string | null",
  "areas": [
    {
      "id": "string",
      "name": "string | null",
      "detail": "string | null",
      "width": 120,
      "height": 40,
      "depth": 35,
      "x": 0,
      "y": 0,
      "z": 0,
      "unplaced": false,
      "fixedMeans": { "width": 14, "height": 19, "depth": 10 },
      "boxes": [
        {
          "id": "string",
          "name": "string | null",
          "detail": "string | null",
          "position": { "x": 0, "y": 0, "z": 0 },
          "rotation": 0,
          "rotatedSize": { "width": 14, "height": 19, "depth": 10 }
        }
      ]
    }
  ]
}
```

**Response field notes**

| Field | Description |
|---|---|
| `areas[].unplaced` | `true` for the synthetic `UNFITTED` area that collects boxes that could not be placed. |
| `areas[].fixedMeans` | Minimized container dimensions used by the algorithm (may be smaller than declared area). |
| `boxes[].rotation` | Applied rotation enum — see `Rotation.enum.ts` in the frontend. |
| `boxes[].rotatedSize` | Effective box size after rotation is applied. |

**Algorithm behaviour**

- Areas are sorted largest-volume-first before assignment.
- Boxes are sorted heaviest-first (weight descending) before placement.
- Positions are chosen via the Extreme Points heuristic (Crainic, Perboli, Tadei 2008), lex order `(Y, Z, X)` — floor fills before stacking.
- Stability: each placed box must have ≥ `minSupportRatio` of its base supported and its centre of gravity inside the support polygon.
- Boxes that cannot fit any area are collected into a virtual area with `id: "UNFITTED"` and `unplaced: true`. They are never silently dropped.
- The `exitCorridor` AABB is excluded from candidate positions in `PositionFinderStage`.
- Coordinates are returned in user space anchored to the declared `accessCorner`.

**Error responses**

| Status | Cause |
|---|---|
| 400 | FluentValidation failure (missing id, non-positive dimensions, corridor outside area, etc.) |
| 500 | Unhandled exception (domain or algorithm error) |

## CORS

Allowed origin: `FRONTEND_ORIGIN` env var. Methods: `GET`, `POST`.
