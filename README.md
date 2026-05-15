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
- `.agent/templates/` — starter templates for `AGENTS.md`, contracts, and initial/change plans.
- `scripts/verify-deploy.mjs` — dependency-light live content verification plus optional latest GitHub Actions deploy check via `gh`.

Start from the runbooks, copy templates into place, then run the standard gates:
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
