# AgentSite Recipe Registry

The recipe registry is a static-safe pattern library for AgentSite builds. Recipes describe reusable site patterns in a format that is easy for humans to review and agents to score before applying.

## Recipe taxonomy

Recipes now declare what kind of pattern they are:

- `kind: archetype` — owns the full page skeleton and should create obvious visual/layout divergence.
- `kind: section_recipe` — adds or upgrades a section without owning the whole page.
- `kind: visual_preset` — controls tokens, palette, typography, and rhythm without necessarily changing content structure.

Do not treat every recipe as a whole-site design. `copy-evidence-strip` is intentionally a section recipe; `product-cockpit` and `editorial-ledger` are full-page archetypes.

## What a recipe is

A recipe is a directory under `.agent/recipes/<recipe-id>/` with:

- `recipe.yaml` — machine-readable metadata, taxonomy, safety constraints, suggested sections, and score rubric.
- `README.md` — human-readable usage notes and implementation guidance.
- `acceptance.md` — checklist for deciding whether the recipe was applied safely.

Recipes do not imply live integrations, analytics, payments, customer proof, or real-time data. They are static composition guidance unless a project contract explicitly approves more.

## Current recipes

| Recipe | Kind | Use when | Static-safe notes |
| --- | --- | --- | --- |
| `product-cockpit` | `archetype` | A site needs a high-signal hero plus compact evidence panels, workflow stages, and decision/CTA areas. | Use documented artifacts and user-provided facts only; avoid fake metrics, dashboards, customer logos, or live operational claims. |
| `editorial-ledger` | `archetype` | A site needs calm memo/provenance framing and strong visual divergence from cockpit-dark layouts. | Pair claims with repo-verifiable artifacts; avoid fake case studies, metrics, logos, or endorsements. |
| `copy-evidence-strip` | `section_recipe` | A site needs stronger trust/copy grounding without a full layout overhaul. | Pair each visible claim with a configured artifact or safe repo fact; avoid endorsements, fake metrics, logos, or invented proof. |
| `artifact-gallery` | `section_recipe` | A site needs searchable/filterable proof, docs, screenshots, deploys, recipes, or maintenance artifacts. | Use public-safe static artifact data only; avoid private data, fake live dashboards, payment proof, analytics, or invented evidence. |
| `roadmap-board` | `section_recipe` | A site needs a public-safe improvement queue, next-step board, or local-first static app behavior. | Local browser changes are non-authoritative; durable changes require editing JSON and rerunning QA. |
| `search-index` | `section_recipe` | A site needs searchable public repo/site intelligence across contracts, recipes, artifacts, roadmap items, and plans. | Index only public-safe content; no secrets, private data, auth, API keys, or unsupported semantic/live search claims. |
| `agentsite-atlas` | `section_recipe` | A site needs a navigable map of generated AgentSite proof sites, recipes, deploy evidence, and next improvements. | Atlas entries are public-safe verified records, not live monitoring or private repo inventory. |
| `agent-run-ledger` | `section_recipe` | A site needs a public-safe orchestration trail of agent runs, delegated work, checks, deploys, and next actions. | Ledger entries are curated summaries, not raw transcripts, private logs, or live telemetry. |
| `feature-request-inbox` | `section_recipe` | A site needs a public-safe queue of requested improvements with priority, acceptance criteria, recipes, and verification plans. | Inbox entries are curated public summaries, not private tickets, raw chats, live sync, or support data. |

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
   npm run recommend:recipes -- --config examples/editorial-ledger.config.json
   ```
4. Select only recipes that fit the brief and contract boundaries.
5. Record selected recipe IDs, archetype, and visual preset in the project plan or generated scaffold config.
6. For generator-created scaffolds:
   - `recipes: ["product-cockpit"]`, `visualPreset: "cockpit-dark"`, or `visualPreset: "product-cockpit"` renders the product-cockpit archetype.
   - `recipes: ["editorial-ledger"]`, `archetype: "editorial-ledger"`, or `visualPreset: "editorial-light"` renders the editorial-ledger archetype.
   - `recipes: ["copy-evidence-strip"]` or `visualPreset: "evidence-strip"` adds a claim-to-artifact section.
   - `recipes: ["artifact-gallery"]` or `visualPreset: "artifact-gallery"` adds a searchable/filterable artifact gallery backed by `src/data/artifacts.json`.
   - `recipes: ["roadmap-board"]` or `visualPreset: "roadmap-board"` adds a local-first roadmap board backed by `src/data/roadmap.json`.
   - `recipes: ["search-index"]` or `visualPreset: "search-index"` adds a precomputed search surface backed by `src/data/search-index.json`.
   - `recipes: ["agentsite-atlas"]` or `visualPreset: "agentsite-atlas"` adds a generated proof-site directory backed by `src/data/atlas.json`.
   - `recipes: ["agent-run-ledger"]` or `visualPreset: "agent-run-ledger"` adds a static orchestration/run history backed by `src/data/runs.json`.
   - `recipes: ["feature-request-inbox"]` or `visualPreset: "feature-request-inbox"` adds a static request queue backed by `src/data/requests.json`.
7. To let the generator infer from natural-language brief/config signals, pass `--auto-recipes` or set `"autoRecipes": true`. Auto mode is deterministic, can select an archetype plus section recipes, and never overrides explicit `recipes`, `archetype`, or `visualPreset` values.
8. Run `npm run check:visual-divergence` when changing archetypes or visual presets.
9. Apply the pattern with static copy and verifiable artifacts only.
10. Run QA before handoff.

## Recipe authoring checklist

Each recipe should include:

- Stable lowercase `id` that matches the directory name.
- Clear `name`, `version`, `status`, `kind`, `summary`, and `best_for` fields.
- If `kind: archetype`, a distinct `archetype` value and visual/layout acceptance criteria.
- If `kind: section_recipe`, clear composability rules.
- Explicit `static_safety` rules.
- `inputs` that describe required human/project facts.
- `sections` or composition guidance that can be implemented without server-side runtime.
- `scoring.criteria` with weights that total to 100.
- A README and acceptance checklist.

Keep recipes small, truthful, and composable. A recipe should make a build easier to reason about, not hide unsupported behavior.
