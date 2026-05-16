# AgentSite Recipe Registry

The recipe registry is a static-safe pattern library for AgentSite builds. Recipes describe reusable site patterns in a format that is easy for humans to review and agents to score before applying.

## What a recipe is

A recipe is a directory under `.agent/recipes/<recipe-id>/` with:

- `recipe.yaml` — machine-readable metadata, safety constraints, suggested sections, and score rubric.
- `README.md` — human-readable usage notes and implementation guidance.
- `acceptance.md` — checklist for deciding whether the recipe was applied safely.

Recipes do not imply live integrations, analytics, payments, customer proof, or real-time data. They are static composition guidance unless a project contract explicitly approves more.

## Current recipes

| Recipe | Use when | Static-safe notes |
| --- | --- | --- |
| `product-cockpit` | A site needs a high-signal hero plus compact evidence panels, workflow stages, and decision/CTA areas. | Use documented artifacts and user-provided facts only; avoid fake metrics, dashboards, customer logos, or live operational claims. |
| `copy-evidence-strip` | A site needs stronger trust/copy grounding without a full layout overhaul. | Pair each visible claim with a configured artifact or safe repo fact; avoid endorsements, fake metrics, logos, or invented proof. |

## Agent workflow

1. Read the site contracts first: `.agent/site.contract.yaml`, `.agent/brand.contract.yaml`, and `.agent/payment.contract.yaml`.
2. List available recipes:
   ```bash
   npm run list:recipes
   ```
3. Score candidate recipes:
   ```bash
   npm run score:recipes
   npm run score:recipes -- --json
   npm run recommend:recipes -- --config examples/auto-recipes.config.json
   ```
4. Select only recipes that fit the brief and contract boundaries.
5. Record selected recipe IDs and visual preset in the project plan or generated scaffold config.
6. For generator-created scaffolds, selecting `recipes: ["product-cockpit"]`, `visualPreset: "cockpit-dark"`, or `visualPreset: "product-cockpit"` renders the product-cockpit UI template automatically. Selecting `recipes: ["copy-evidence-strip"]` or `visualPreset: "evidence-strip"` adds a claim-to-artifact strip to either the default or cockpit layout.
7. To let the generator infer from natural-language brief/config signals, pass `--auto-recipes` or set `"autoRecipes": true`. Auto mode is deterministic, can select `product-cockpit`, `copy-evidence-strip`, or both, and never overrides explicit `recipes` or `visualPreset` values (including an explicit empty `recipes: []`).
8. Apply the pattern with static copy and verifiable artifacts only.
9. Run QA before handoff.

## Recipe authoring checklist

Each recipe should include:

- Stable lowercase `id` that matches the directory name.
- Clear `name`, `version`, `status`, `summary`, and `best_for` fields.
- Explicit `static_safety` rules.
- `inputs` that describe required human/project facts.
- `sections` or composition guidance that can be implemented without server-side runtime.
- `scoring.criteria` with weights that total to 100.
- A README and acceptance checklist.

Keep recipes small, truthful, and composable. A recipe should make a build easier to reason about, not hide unsupported behavior.
