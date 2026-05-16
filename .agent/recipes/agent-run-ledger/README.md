# Agent Run Ledger Recipe

`agent-run-ledger` creates a static orchestration trail for AgentSite work.

It creates:

- `src/data/runs.json`
- `src/components/AgentRunLedger.astro`
- `scripts/check-runs.mjs`

The ledger is public-safe run metadata, not raw transcripts or live monitoring.
