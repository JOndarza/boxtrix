<!-- mirrors: docs/architecture.md, docs/roadmap.md -->

# Business context

- **Product**: BoxTrix — web app that calculates optimal 3D placement of empty collectible-product boxes into storage areas
- **Core value**: eliminates manual trial-and-error when packing boxes; computes the most space-efficient arrangement instantly
- **Ecosystem actors**: end user (provides box + area dimensions), backend API (runs 3D bin packing), frontend (renders 3D result via Three.js)
- **Main user flow**: user inputs box sizes + area sizes → POST /organize/sort → algorithm assigns each box a position/rotation per area → 3D visualization rendered
- **Privacy / security constraints**: no user data is persisted (stateless API); JWT auth available but currently disabled on the organize endpoint
- **Hard business rules**: all boxes that cannot be placed must be reported (collected in a virtual UNFITTED area, never silently dropped)
- **Out of scope**: user accounts, saved projects, e-commerce integration, real-time collaboration
