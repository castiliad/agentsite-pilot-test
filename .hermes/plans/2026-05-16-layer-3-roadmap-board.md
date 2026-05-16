# Layer 3: local-first roadmap board

## Goal
Add a static local-first mini app primitive: a JSON-backed roadmap board with search, priority filters, status columns, and browser-local status overrides.

## Scope
- Add `roadmap-board` section recipe.
- Add `src/data/roadmap.json` and `src/components/RoadmapBoard.astro`.
- Add `scripts/check-roadmap.mjs` and wire it into QA.
- Add generator support and example config.
- Publish a disposable proof site and verify live deploy.

## Non-goals
- No backend, auth, database, issues integration, analytics, notifications, or authoritative shared state.
- No claims that local browser changes update the repo.

## Acceptance criteria
- Recipe scores pass.
- Source and generated `npm run qa:full` pass.
- Visual QA exercises roadmap search/filter/local status behavior when present.
- Proof site deploys and live verification passes.
