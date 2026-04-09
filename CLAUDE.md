# BoxTrix — Project Rules

## Context
3D space optimizer that calculates optimal placement of collectible product boxes inside storage areas using the BinPackingJS algorithm, with an Angular 18 frontend rendering results via Three.js.

## Hard NOs
- NEVER create database migrations autonomously — there is no DB in this project; if one is introduced, require manual review
- NEVER use `git add -A` or `git add .` — always stage specific files by name
- NEVER skip pre-commit hooks (`--no-verify`) or force-push to main
- NEVER call `HttpClient` directly from Angular components — use typed services
- NEVER skip layers: API → Application → Domain; never call Domain from the API directly

## Conventions
- **Documentation language**: english
- **Code language**: english
- PascalCase for classes and interfaces, camelCase for variables and methods

## Process
- **Branches**: `main` = prod, `feature/<slug>` for features
- **Commits**: conventional format, imperative mood, no AI attribution
- **CI**: all checks must pass before merge

## Where context comes from
- **Always-loaded rules**: `.claude/rules/*.md` without `paths:` frontmatter — load every session
- **Auto-loaded rules**: `.claude/rules/*.md` with `paths:` frontmatter — load only when Claude reads matching files
- **Full docs**: `docs/*.md` — read on-demand when detail is needed beyond what the rules carry
- **Governance**: `docs/README.md` — doc-folder rules, story/bug workflows
