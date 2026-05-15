# Initial site build plan: [PROJECT_NAME]

## Request
[Paste or summarize the natural-language request.]

## Assumptions
- [Safe, reversible assumption.]
- The site remains static and deploys to GitHub Pages unless approved otherwise.
- No analytics, payments, fake customers, fake metrics, or unsupported claims will be added.

## Scope
- [What will be built.]

## Non-goals
- [What will not be changed or added.]

## Files expected to change
- `AGENTS.md`
- `.agent/site.contract.yaml`
- `.agent/brand.contract.yaml`
- `.agent/payment.contract.yaml`
- `.agent/runbooks/deploy.md`
- `.agent/runbooks/feature-request.md`
- `.github/workflows/deploy.yml`
- `package.json`
- `scripts/*`
- `src/**`

## Acceptance criteria
- [Hero and primary sections satisfy the request.]
- Contracts exist and match visible copy.
- QA scripts pass locally.
- GitHub Pages deploy succeeds.
- Live URL contains `[EXPECTED_TEXT]`.

## QA commands
```bash
npm run qa
npm audit --audit-level=moderate
```

## Deploy/verify
```bash
LIVE_URL="[LIVE_URL]" \
EXPECT_TEXT="[EXPECTED_TEXT]" \
REPO="[OWNER/REPO]" \
npm run verify:deploy
```

## Follow-up
- [Known next improvement.]
