# Plan: codify AgentSite workflow artifacts

## Scope
Codify the successful AgentSite Pilot build and follow-up change-request loop into reusable, repo-local workflow artifacts that future agents can copy or adapt without asking basic setup questions.

In scope:
- New runbooks for greenfield natural-language site builds and scoped change requests.
- Reusable templates for `AGENTS.md`, site/brand/payment contracts, and initial/change plans.
- A dependency-light deploy verification script for live GitHub Pages content and optional GitHub Actions status.
- README/package updates exposing the reusable workflow and verification command.

Out of scope:
- Changing live site content, product claims, payment mode, analytics, DNS, or deployment target.
- Adding third-party dependencies or a generator CLI.
- Replacing the existing QA gate.

## Acceptance criteria
- Artifacts are specific enough for future agents to execute: intake, plan, contracts, implementation, QA, deploy, live verification, and handoff.
- Templates use placeholders and do not claim unsupported proof, customers, payment availability, or analytics.
- `scripts/verify-deploy.mjs` is safe, dependency-light, prints clear usage when required env is missing, and exits nonzero on verification failures.
- `README.md` includes a concise reusable workflow section and commands.
- `package.json` includes a practical `verify:deploy` script without breaking existing scripts.
- Local QA passes: `npm run qa`.
- Security audit passes or reports no moderate+ actionable issues: `npm audit --audit-level=moderate`.
- Changes are committed with a conventional commit and pushed to `main`.
- GitHub Pages deploy succeeds, the live URL loads, and the current hero copy is present.
- Final `git status` is clean.

## Exact files expected to change
Add:
- `.agent/runbooks/new-site-workflow.md`
- `.agent/runbooks/change-request-workflow.md`
- `.agent/templates/AGENTS.template.md`
- `.agent/templates/site.contract.template.yaml`
- `.agent/templates/brand.contract.template.yaml`
- `.agent/templates/payment.contract.template.yaml`
- `.agent/templates/initial-plan.template.md`
- `.agent/templates/change-plan.template.md`
- `scripts/verify-deploy.mjs`

Update:
- `README.md`
- `package.json`
- `.hermes/plans/2026-05-15-codify-agentsite-workflow.md`

## QA commands
```bash
npm run qa
npm audit --audit-level=moderate
LIVE_URL="https://castiliad.github.io/agentsite-pilot-test/" \
EXPECT_TEXT="Ask for a website in natural language" \
REPO="castiliad/agentsite-pilot-test" \
npm run verify:deploy
```

## Deploy/verify
1. Commit with a conventional commit message.
2. Push `main`.
3. Wait for `.github/workflows/deploy.yml` to complete successfully.
4. Verify the live URL contains the current hero copy.
5. Confirm `git status --short --branch` is clean and tracking `origin/main`.

## Follow-up
- Extract these templates/runbooks into a Hermes skill or starter template.
- Consider a small generator that copies templates, substitutes placeholders, and initializes QA scripts.
- Add optional screenshot capture/visual QA once a browser harness is available.
