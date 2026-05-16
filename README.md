# AgentSite Pilot test site

Premium static landing page for an experimental service that turns natural-language website requests into agent-maintained GitHub Pages links.

## Live URL
https://castiliad.github.io/agentsite-pilot-test/

## Repository
https://github.com/castiliad/agentsite-pilot-test

## Local development
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## QA
Run the full local gate:
```bash
npm run qa
```

Run browser/mobile visual QA explicitly when checking layout-sensitive changes:
```bash
npm run test:visual
```

`test:visual` builds and serves the production site locally, checks desktop and mobile viewports, fails on console/page errors, horizontal overflow, missing hero/nav/CTA visibility, broken internal hash anchors, and visible nav ellipses, then writes screenshots to `.agent/audits/screenshots/`. If Chromium is not installed on the machine yet, run `npx playwright install chromium` once.

Run the static and browser gates together:
```bash
npm run qa:full
```

Individual checks:
```bash
npm run check:contract
npm run check:claims
npm run check:seo
npm run check:links
npm run check:artifacts
npm run check:roadmap
npm run build:search-index
npm run check:search-index
npm run test:visual
```

## Reusable workflow
This repo now codifies the AgentSite pilot loop as reusable, repo-local artifacts:
- `.agent/runbooks/new-site-workflow.md` — natural-language brief to contract-backed GitHub Pages site.
- `.agent/runbooks/change-request-workflow.md` — scoped change request to plan, QA, deploy, and verify.
- `.agent/runbooks/generator.md` — first-pass scaffold/generator usage and safety notes.
- `.agent/templates/` — starter templates for `AGENTS.md`, contracts, and initial/change plans.
- `scripts/create-agentsite.mjs` — dependency-light AgentSite scaffold generator; local-only by default.
- `scripts/verify-deploy.mjs` — dependency-light live content verification plus optional latest GitHub Actions deploy check via `gh`.

Start from the runbooks, copy templates into place, or generate a starter locally:
```bash
npm run create:agentsite -- \
  --name "Example AgentSite" \
  --repo example-agentsite \
  --owner castiliad \
  --brief "A concise static landing page for an example project." \
  --out /tmp/example-agentsite

cd /tmp/example-agentsite
npm install
npm run qa
npm run test:visual
```

Or generate from a richer JSON brief/config file:
```bash
npm run create:agentsite -- \
  --config .agent/templates/sample.agentsite.config.json \
  --out /tmp/harbor-notes-agentsite \
  --force

cd /tmp/harbor-notes-agentsite
npm install
npm run qa
npm run test:visual
```

Config JSON supports `name`, `repo`, `owner`, `description`, `brief`, optional hero copy fields (`heroHeadline`, `heroLede`), CTA fields, `audience`, `visualDirection`, `sections`, `proofArtifacts`, `allowedClaims`, `forbiddenClaims`, `approvalRequired`, explicit `recipes`, explicit `archetype`, explicit `visualPreset`, and `autoRecipes`. Sections may include an optional `navLabel` for short navigation text. CLI flags override config values. The generator validates invalid JSON, missing merged `name`/`repo`/`brief`, invalid section ids, and publish attempts without an owner. Generated repos include `check:artifacts`, `check:roadmap`, `build:search-index`, `check:search-index`, `test:visual`, `qa:full`, and `check:visual-divergence`; install Chromium with `npx playwright install chromium` if the first browser QA run asks for it.

Recipe selection stays explicit by default. If `--auto-recipes` or `"autoRecipes": true` is set and no explicit `recipes`, `archetype`, or `visualPreset` is provided, deterministic heuristics may select a full-page archetype plus section recipes. `product-cockpit` fits product/service/pilot/agent/workflow/AI/tool/dashboard/review/QA/deploy/operator/founder/B2B/dev/technical signals. `editorial-ledger` fits editorial/memo/ledger/provenance/narrative/trust/copy/evidence signals. `copy-evidence-strip` fits proof/claims/trust/artifact/docs/screenshot/contract/copy-positioning signals and proof artifacts. `artifact-gallery` fits searchable/filterable artifact, directory, catalog, screenshots, plans, deploys, and proof-browser signals. `roadmap-board` fits roadmap, backlog, next-step, status, priority, local-first, and agent-maintenance signals. `search-index` fits search, queryable, site brain, static intelligence, recipes, contracts, plans, and artifact discovery signals. The generated README, AGENTS, and site contract record `archetype` and `auto_recipe_selection`. Preview recommendations without writing files:
```bash
npm run recommend:recipes -- --config examples/auto-recipes.config.json
npm run recommend:recipes -- --config examples/auto-evidence-strip.config.json
npm run recommend:recipes -- --config examples/editorial-ledger.config.json
npm run recommend:recipes -- --config examples/artifact-gallery.config.json
npm run recommend:recipes -- --config examples/roadmap-board.config.json
npm run recommend:recipes -- --config examples/search-index.config.json
npm run check:visual-divergence
```

The generator does not create a GitHub repo unless `--publish` is explicitly passed. See `.agent/runbooks/generator.md` for config usage, publish-mode requirements, and caveats.

Run the standard gates in this pilot repo:
```bash
npm run qa
npm audit --audit-level=moderate
```

Verify a deployed site:
```bash
LIVE_URL="https://castiliad.github.io/agentsite-pilot-test/" \
EXPECT_TEXT="Ask for a website in natural language" \
REPO="castiliad/agentsite-pilot-test" \
npm run verify:deploy
```

If `REPO` is omitted, `verify:deploy` checks only the live URL/content. If `gh` is unavailable, the script skips the GitHub Actions check with a clear message.

## Agent maintenance notes
- Read `AGENTS.md` before editing.
- Keep visible copy aligned with `.agent/site.contract.yaml` and `.agent/brand.contract.yaml`.
- Payment mode is disabled in `.agent/payment.contract.yaml`; do not add payment links without explicit human approval.
- Deployment is GitHub Pages via `.github/workflows/deploy.yml`.
- Record non-trivial plans in `.hermes/plans/`.
