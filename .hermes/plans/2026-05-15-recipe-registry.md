# AgentSite Recipe Registry plan

Date: 2026-05-15

## Request

Implement the AgentSite Recipe Registry milestone in the pilot generator repository without changing the Harbor Notes playground.

## Goals

- Add a static-safe recipe registry under `.agent/recipes/`.
- Seed the registry with a `product-cockpit` recipe that is reusable, scorable, composable, and agent-readable.
- Add lightweight registry list and score scripts with npm aliases.
- Surface selected `recipes` and `visualPreset` values in generated AgentSite documentation/contracts when provided in config.
- Run local QA, commit, push, and verify deployment where possible.

## Non-goals

- No automatic UI transformation for recipes in this milestone.
- No live data, analytics, payments, server runtime, fake metrics, fake customers, or fabricated proof.
- No changes to the Harbor Notes playground.

## Acceptance criteria

- `.agent/recipes/README.md` documents the registry workflow.
- `.agent/recipes/product-cockpit/recipe.yaml`, `README.md`, and `acceptance.md` exist.
- `scripts/list-recipes.mjs` and `scripts/score-recipes.mjs` run without external dependencies.
- `package.json` includes `list:recipes` and `score:recipes` scripts.
- `scripts/create-agentsite.mjs` accepts config/CLI values for `recipes` and `visualPreset` and records them in generated README, AGENTS, and site contract output.
- Required QA commands are run and results are captured in the handoff.
