# Search Index Recipe

`search-index` adds a static intelligence/search layer to an AgentSite.

## What it creates

- `scripts/build-search-index.mjs` builds `src/data/search-index.json` from public-safe repo/site metadata.
- `scripts/check-search-index.mjs` validates entry shape, allowed types, safe hrefs, and blocked public-index language.
- `src/components/SearchIndex.astro` renders client-side search and type filtering.

## Safety rule

The index is public. Do not index secrets, private docs, credentials, internal tickets, or anything that should not ship to GitHub Pages.

## Durable updates

Future agents should run:

```bash
npm run build:search-index
npm run check:search-index
npm run qa:full
```
