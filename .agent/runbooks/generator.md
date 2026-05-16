# AgentSite generator runbook

Use `npm run create:agentsite` to create a new AgentSite starter from a natural-language brief. The generator is safe by default: it only writes local files under `--out` unless `--publish` is explicitly passed.

## Local scaffold only
```bash
npm run create:agentsite -- \
  --name "Example AgentSite" \
  --repo example-agentsite \
  --owner castiliad \
  --brief "A concise static landing page for an example project." \
  --out /tmp/example-agentsite
```

Then validate locally:
```bash
cd /tmp/example-agentsite
npm install
npm run qa
npm run test:visual
```

`npm run qa` remains the fast static/build gate. `npm run test:visual` is the explicit browser/mobile gate; it builds and serves the production site, checks desktop and mobile viewports, fails on console/page errors, horizontal overflow, missing hero/nav/CTA visibility, broken hash anchors, and visible nav ellipses, and writes screenshots to `.agent/audits/screenshots/`. If the local machine has not installed Playwright browsers yet, run `npx playwright install chromium` once.

For layout-sensitive handoffs, run both gates:
```bash
npm run qa:full
```

Expected live URL printed by the generator:
```text
https://castiliad.github.io/example-agentsite/
```

## Config-driven scaffold
Use `--config <path>` to provide richer JSON input without adding dependencies. CLI flags override config values, so a shared config can be reused with `--repo`, `--name`, or `--out` overrides.

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

Supported JSON fields:
- `name`, `repo`, `owner`, `description`, `brief`
- `heroHeadline`, `heroLede`: optional visible hero copy overrides; without them the generator derives concise, user-facing copy instead of reusing raw instruction text
- `primaryCtaLabel`, `primaryCtaHref`
- `audience`: string array
- `visualDirection`: string
- `sections`: array of `{ "id", "title", "body", "navLabel" }`; ids must start with a lowercase letter and use lowercase letters, numbers, and dashes; `navLabel` is optional and should be short
- `proofArtifacts`: array of `{ "label", "body" }`
- `allowedClaims`, `forbiddenClaims`, `approvalRequired`: string arrays
- `recipes`: explicit lowercase recipe IDs; explicit values are preserved
- `archetype`: explicit full-page archetype; `editorial-ledger` renders the editorial memo/ledger layout
- `visualPreset`: explicit visual preset; `cockpit-dark` or `product-cockpit` renders the cockpit UI; `editorial-light` renders the editorial ledger UI; `evidence-strip` renders the copy-evidence strip
- `autoRecipes`: boolean; when true and no `recipes`/`archetype`/`visualPreset` is explicit, the deterministic selector may choose a primary archetype plus section recipes. `product-cockpit` is for product/service/pilot/agent/workflow/AI/tool/dashboard/review/QA/deploy/operator/founder/B2B/dev/technical signals. `editorial-ledger` is for editorial/memo/ledger/provenance/narrative/trust/copy/evidence signals. `copy-evidence-strip` is for proof/claims/trust/artifact/docs/screenshot/contract/copy-positioning signals and proof artifacts.

Validation fails with a clear message for invalid JSON, missing merged `name`/`repo`/`brief`, invalid or duplicate section ids, and `--publish` without `--owner` after config/CLI merge.

```bash
npm run create:agentsite -- \
  --config examples/auto-recipes.config.json \
  --out /tmp/operator-proof-cockpit \
  --force
npm run recommend:recipes -- --config examples/auto-recipes.config.json
npm run recommend:recipes -- --config examples/editorial-ledger.config.json
npm run check:visual-divergence
```

The generated README, AGENTS, and `.agent/site.contract.yaml` record `auto_recipe_selection` so reviewers can see why a recipe was or was not selected.

## Overwrite a disposable local directory
```bash
npm run create:agentsite -- \
  --name "Disposable AgentSite" \
  --repo disposable-agentsite \
  --owner castiliad \
  --brief "A disposable smoke-test site." \
  --out /tmp/disposable-agentsite \
  --force
```

## Publish mode
Only use publish mode when you intentionally want a public GitHub repository created and pushed:
```bash
npm run create:agentsite -- \
  --name "Published AgentSite" \
  --repo published-agentsite \
  --owner castiliad \
  --brief "A public static landing page for a published AgentSite smoke test." \
  --out /tmp/published-agentsite \
  --publish
```

Publish mode requires:
- authenticated GitHub CLI (`gh auth status` passes),
- `git`, `npm`, and network access,
- permission to create `OWNER/REPO`.

Publish mode initializes git, installs dependencies, runs `npm run qa`, commits, creates a public GitHub repo with `gh repo create`, pushes `main`, and makes a best-effort Pages workflow setup. Some GitHub org policies may still require manual Pages settings review.

Publish mode does not run browser QA automatically. For a published generated site, run `npm run qa:full` locally before publish or in a follow-up verification pass when screenshots are desired.

## Generated project contents
- Astro static site skeleton in `src/`
- `AGENTS.md`
- `.agent/site.contract.yaml`, `.agent/brand.contract.yaml`, `.agent/payment.contract.yaml`
- `.agent/runbooks/deploy.md` and `.agent/runbooks/feature-request.md`
- `.hermes/plans/initial-site-build.md`
- `.github/workflows/deploy.yml`
- QA scripts in `scripts/`
- Browser/mobile screenshot QA via `scripts/visual-qa.mjs`, `npm run test:visual`, and `npm run qa:full`
- `README.md`, `package.json`, `astro.config.mjs`, `.gitignore`

## Safety notes
- Payment remains disabled/no-payment in generated contracts.
- No analytics, tracking, custom domains, server runtime, or database are added.
- The generated site is a safe starter. Future agents should refine copy and design against the brief and contracts.
