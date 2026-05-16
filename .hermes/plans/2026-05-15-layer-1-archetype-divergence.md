# Layer 1 implementation: archetypes and visual divergence

## Request
Proceed from the static-site boundary-push TODO. Start Layer 1: true visual divergence.

## Scope
- Add recipe taxonomy: `archetype`, `section_recipe`, and later `visual_preset`.
- Mark `product-cockpit` as a full-page archetype.
- Mark `copy-evidence-strip` as a section recipe.
- Add a true second full-page archetype: `editorial-ledger`.
- Add explicit generator support for `archetype`.
- Add a visual-divergence check so cockpit and editorial outputs cannot remain visually samey.
- Verify generated editorial output with QA and browser visual checks.

## Non-goals
- No backend, auth, analytics, payments, live data, customer proof, fake metrics, or quoted endorsements.
- Do not add more shallow section recipes before proving archetype divergence.

## Acceptance criteria
- `npm run list:recipes` shows recipe kinds.
- `npm run score:recipes -- --fail-below-threshold` passes.
- `npm run check:visual-divergence` passes.
- `examples/editorial-ledger.config.json` generates a light editorial memo layout that is visually distinct from cockpit-dark.
- Generated `AGENTS.md` and `.agent/site.contract.yaml` record `archetype: editorial-ledger`.
- Generated editorial site passes `npm run qa:full`.
- Source repo passes `npm run qa:full`, `npm audit --audit-level=moderate`, and `git diff --check`.

## Maintainer verdict target
`manageable`: this adds a new conceptual layer but keeps the generator dependency-light and verifiable.
