# Artifact Gallery Recipe

`artifact-gallery` adds a static app-like proof browser to an AgentSite. It is a section recipe, not a full-page archetype.

## What it creates

- `src/data/artifacts.json` as the data contract future agents edit.
- `src/components/ArtifactGallery.astro` as the reusable UI.
- Search input, tag chips, visible result count, and card grid.
- URL query state for the active tag: `?tag=qa`.
- QA validation for safe hrefs, required fields, tags, and unsupported proof language.

## Use when

Use this when a site needs to show real proof artifacts: contracts, plans, deploy runs, visual QA screenshots, recipe docs, audits, source files, or runbooks.

## Do not use for

- private data or secrets
- fake live telemetry
- customer logos or endorsements that were not supplied
- payment or analytics evidence
- dashboards that imply real-time data

## Implementation notes

The gallery should stay static and browser-only. Add artifacts by editing `src/data/artifacts.json`; do not add a database, API, analytics, or tracking unless the site contract explicitly approves it.

Required QA:

```bash
npm run check:artifacts
npm run qa:full
```
