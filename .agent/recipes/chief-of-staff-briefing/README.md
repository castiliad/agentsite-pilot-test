# Chief-of-staff briefing

Use this recipe when an AgentSite needs a compact static operating brief for autonomous maintenance.

It generates `src/data/briefing.json` from public-safe repo data:

- `src/data/requests.json`
- `src/data/roadmap.json`
- `src/data/runs.json`
- `src/data/atlas.json`
- `src/data/search-index.json`

The rendered panel answers:

- What are the top 3 next actions?
- What risk flags or blockers should the orchestrator see first?
- What verified wins happened recently?
- Which recipe should the next implementation run consider?
- Which static sources did the briefing use?

## Commands

```bash
npm run build:briefing
npm run check:briefing
npm run qa:full
```

## Static-safety boundary

The briefing is generated from curated JSON committed to the repo. It is not live monitoring, not a private ticket dashboard, not a transcript summarizer, and not compliance/audit evidence.

Do not add raw chats, private tickets, credentials, telemetry, analytics, auth, or database reads to this recipe without explicit approval and a new architecture plan.
