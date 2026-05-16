# Layer 2: artifact gallery static interaction

## Request
Proceed from visual divergence into the next static-site complexity layer: rich static interactions that future agents can maintain safely.

## Goal
Add a reusable `artifact-gallery` section recipe that turns repo proof into a searchable/filterable static interface without backend runtime, analytics, payment systems, or private data.

## Scope
- Add `.agent/recipes/artifact-gallery/` with metadata, README, and acceptance checklist.
- Add `src/data/artifacts.json` as the data contract.
- Add `src/components/ArtifactGallery.astro` with search, tag filters, result count, and URL tag state.
- Add `scripts/check-artifacts.mjs` and wire it into `npm run qa`.
- Update generator output so selected `artifact-gallery` recipes render the component and copy data/check files into generated repos.
- Add `examples/artifact-gallery.config.json`.
- Publish a disposable proof site and verify deploy.

## Non-goals
- No backend, auth, database, analytics, cookies, telemetry, payments, or private artifact access.
- No fake live dashboard or invented proof.
- No replacement of existing archetypes.

## Acceptance criteria
- `npm run list:recipes` shows `artifact-gallery` as a `section_recipe`.
- `npm run score:recipes -- --fail-below-threshold` passes for all recipes.
- `npm run check:artifacts` validates public-safe artifact data.
- Generated artifact-gallery scaffold runs `npm run qa:full` successfully.
- Disposable proof site deploys to GitHub Pages and live content contains the configured hero text.
- Browser visual review confirms search/filter controls are visible and mobile-safe.

## QA commands
```bash
node --check scripts/create-agentsite.mjs
node --check scripts/check-artifacts.mjs
npm run list:recipes
npm run score:recipes -- --fail-below-threshold
npm run recommend:recipes -- --config examples/artifact-gallery.config.json
npm run qa:full
npm audit --audit-level=moderate
git diff --check
```
