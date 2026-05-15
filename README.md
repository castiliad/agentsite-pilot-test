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

## Agent maintenance notes
- Read `AGENTS.md` before editing.
- Keep visible copy aligned with `.agent/site.contract.yaml` and `.agent/brand.contract.yaml`.
- Payment mode is disabled in `.agent/payment.contract.yaml`; do not add payment links without explicit human approval.
- Deployment is GitHub Pages via `.github/workflows/deploy.yml`.
- Record non-trivial plans in `.hermes/plans/`.
