# Recipe selector implementation plan

Date: 2026-05-15

## Objective
Add deterministic, low-risk auto recipe recommendation and selection to the AgentSite generator without changing the default generation path.

## Requirements
- Preserve explicit `recipes` and `visualPreset` selections; do not override explicit empty recipe selections.
- Only infer recipes when `--auto-recipes` or `autoRecipes: true` is provided.
- Select the existing `product-cockpit` recipe for product/service/pilot/agent/workflow/AI/tool/dashboard/review/proof/artifact/QA/deploy/consultant/operator/founder/B2B/dev/technical signals, explicit proof artifacts, or proof/workflow/boundary sections.
- Record the selector reason in generated README, AGENTS, and site contract.
- Add a zero-dependency recommendation CLI and docs/example config.
- Smoke test default, auto, and explicit paths.

## Implementation
1. Add shared deterministic selector helper in `scripts/recipe-selector.mjs`.
2. Add `scripts/recommend-recipes.mjs` and `npm run recommend:recipes`.
3. Wire selector into `scripts/create-agentsite.mjs` after config/CLI merge and normalization.
4. Update generated scaffolds to include selector metadata and helper scripts.
5. Add `examples/auto-recipes.config.json` plus README/runbook/recipe-registry docs.

## Acceptance criteria
- Default generation without auto remains non-cockpit.
- Auto config generates product-cockpit and records `auto_recipe_selection` reason.
- Explicit recipe or preset settings are preserved and not overridden by auto mode.
- Required commands pass: list/score/recommend, QA, visual QA, audit, diff check.
- Generated auto site passes `npm run qa:full` locally.
- Commit is pushed and GitHub Pages deployment verifies live content.
