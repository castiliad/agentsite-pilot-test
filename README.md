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

Individual checks:
```bash
npm run check:contract
npm run check:claims
npm run check:seo
npm run check:links
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
```

Config JSON supports `name`, `repo`, `owner`, `description`, `brief`, optional hero copy fields (`heroHeadline`, `heroLede`), CTA fields, `audience`, `visualDirection`, `sections`, `proofArtifacts`, `allowedClaims`, `forbiddenClaims`, and `approvalRequired`. Sections may include an optional `navLabel` for short navigation text. CLI flags override config values. The generator validates invalid JSON, missing merged `name`/`repo`/`brief`, invalid section ids, and publish attempts without an owner.

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
