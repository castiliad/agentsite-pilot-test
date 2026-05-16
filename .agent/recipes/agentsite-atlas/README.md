# AgentSite Atlas Recipe

`agentsite-atlas` turns proof sites into a static directory.

It creates:

- `src/data/atlas.json`
- `src/components/AgentSiteAtlas.astro`
- `scripts/check-atlas.mjs`

The atlas is a public-safe map of generated sites, not live monitoring. Future agents update durable state by editing `src/data/atlas.json` and running QA.
