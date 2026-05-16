# Layer 4: static intelligence search index

## Goal
Add a precomputed public-safe search index over AgentSite repo/site intelligence so static sites feel queryable without a backend.

## Scope
- Add `search-index` recipe.
- Add index builder/checker scripts.
- Add `src/data/search-index.json` and `src/components/SearchIndex.astro`.
- Wire generation, selector, QA, and visual interaction checks.
- Publish disposable proof site and verify live deploy.

## Non-goals
- No semantic/vector search, embeddings, API keys, backend, auth, analytics, private data, or live crawling.

## Acceptance criteria
- Recipe scoring passes.
- Search and type filters work in visual QA.
- Source and generated proof pass `npm run qa:full` and deploy verification.
