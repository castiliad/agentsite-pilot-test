# Roadmap Board Recipe

`roadmap-board` adds a static local-first improvement board to an AgentSite.

## What it creates

- `src/data/roadmap.json` as the public roadmap data contract.
- `src/components/RoadmapBoard.astro` as the board UI.
- Status columns: Now, Next, Later, Blocked.
- Search and priority filters.
- Browser-local status overrides using `localStorage`.
- A reset control that clears local-only changes.
- `npm run check:roadmap` validation.

## Safety rule

The board is not an authoritative task system. Local browser changes do not update GitHub, issues, commits, deploys, or any shared data. Agents must edit `src/data/roadmap.json` and run QA for durable roadmap changes.
