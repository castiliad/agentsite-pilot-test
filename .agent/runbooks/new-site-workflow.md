# New site workflow: brief → GitHub Pages link

Use this runbook when a requester gives a natural-language brief and expects a new static site with source, contracts, QA evidence, deployment evidence, and a maintainable handoff.

## 0. Preconditions
- Confirm the requested result is a static site suitable for GitHub Pages.
- Stop for approval before adding analytics, cookies, tracking, payment links, custom domains/DNS, server runtime, database, customer claims, benchmarks, or availability promises.
- Prefer existing project scripts and templates over inventing new process.

## 1. Capture the brief
Record the requester language and translate it into:
- audience and primary job-to-be-done,
- required sections and calls to action,
- allowed claims with source/evidence,
- disallowed claims and approval-required areas,
- visual/brand direction,
- deployment target and live URL expectation,
- maintenance owner role.

If information is missing, make explicit assumptions only when they are safe and reversible.

## 2. Create repository guardrails first
Before building page content, add or adapt:
- `AGENTS.md` from `.agent/templates/AGENTS.template.md`,
- `.agent/site.contract.yaml` from `.agent/templates/site.contract.template.yaml`,
- `.agent/brand.contract.yaml` from `.agent/templates/brand.contract.template.yaml`,
- `.agent/payment.contract.yaml` from `.agent/templates/payment.contract.template.yaml`,
- `.agent/runbooks/deploy.md`,
- `.agent/runbooks/feature-request.md` or `.agent/runbooks/change-request-workflow.md`.

Keep payment disabled unless explicit human approval says otherwise.

## 3. Plan the initial build
Create `.hermes/plans/<date>-initial-site-build.md` from `.agent/templates/initial-plan.template.md`.

The plan must include:
- scope and non-goals,
- acceptance criteria,
- exact files expected to change,
- QA commands,
- deploy/verify steps,
- caveats and follow-up.

## 4. Implement the smallest complete site
- Build semantic, responsive static pages/components.
- Keep copy aligned with contracts.
- Avoid unsupported claims, fake social proof, fake metrics, and external services not approved in contracts.
- Add lightweight QA scripts when a contract rule can be mechanically checked.
- Add npm scripts for all repeatable QA gates.

## 5. Run local QA
Run the full gate before handoff:
```bash
npm run qa
npm audit --audit-level=moderate
```

Fix failures before deployment. If a failure is environmental, document the command, output, and why it is non-blocking.

## 6. Commit and deploy
- Commit with a conventional commit message, e.g. `feat: launch agentsite landing page`.
- Push to `main` only after QA passes.
- Let `.github/workflows/deploy.yml` publish GitHub Pages.
- Do not rewrite public history unless explicitly approved.

## 7. Verify live delivery
Use the project verifier when available:
```bash
LIVE_URL="https://<owner>.github.io/<repo>/" \
EXPECT_TEXT="<hero or other stable visible text>" \
REPO="<owner>/<repo>" \
npm run verify:deploy
```

Manual fallback:
```bash
gh run list --workflow deploy.yml --limit 3
curl -L "https://<owner>.github.io/<repo>/" | grep "<hero or other stable visible text>"
```

## 8. Handoff
Return:
- status,
- commit SHA,
- live URL,
- deployment run URL/result,
- checks run and results,
- files changed,
- known caveats,
- next recommended change.
