# Primary Surface Layout

Use this recipe when a generated AgentSite has several app-like modules and the most important one is getting buried.

It changes composition behavior:

- infer or accept a `primarySurface` such as `briefing`, `requests`, `runs`, `atlas`, `search`, `roadmap`, or `artifacts`
- render that primary module first in the recipe stack
- wrap secondary modules in accessible `<details>` / `<summary>` panels under `#secondary-modules`
- keep proof, boundaries, and CTA sections available after the functional stack

## Trigger forms

```json
{
  "recipes": ["primary-surface-layout", "chief-of-staff-briefing"],
  "primarySurface": "briefing"
}
```

or:

```bash
npm run create:agentsite -- --config examples/primary-surface-layout.config.json --primary-surface briefing
```

## Static-safety boundary

This is layout only. It does not add persistence, analytics, auth, live sync, or server state. Do not use collapsibles to hide approval boundaries, no-payment mode, or public-safety caveats.

## QA

```bash
npm run check:layout
npm run qa:full
```
