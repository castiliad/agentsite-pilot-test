# Change request workflow: request → plan → QA → deploy → verify

Use this runbook when an existing AgentSite receives a scoped change request.

## 1. Intake and classification
1. Capture the requester language verbatim.
2. Classify the request:
   - copy/content,
   - visual/layout,
   - contract/guardrail,
   - QA/script,
   - deployment/configuration,
   - approval-required area.
3. Read `AGENTS.md`, `.agent/*.contract.yaml`, existing runbooks, active plans, `package.json`, and relevant source files.
4. Stop for approval if the request touches blocked areas in `AGENTS.md` or contracts.

## 2. Create/update a change plan
For non-trivial work, create `.hermes/plans/<date>-<slug>.md` from `.agent/templates/change-plan.template.md`.

Include:
- request and assumptions,
- scope and non-goals,
- acceptance criteria,
- exact files expected to change,
- QA commands,
- deploy/verify steps,
- rollback notes.

Small typo-only changes may skip a full plan only if `AGENTS.md` allows it and the handoff still documents QA.

## 3. Implement safely
- Make the smallest coherent change that satisfies the plan.
- Keep site content truthful and contract-aligned.
- Do not add analytics, payments, custom domains, server runtime, database, customer claims, or metrics without approval.
- Update QA scripts or runbooks when the change introduces a new repeatable rule.
- Avoid broad rewrites unless the request requires them.

## 4. Local QA
Run:
```bash
npm run qa
npm audit --audit-level=moderate
```

If a deployment verification script exists and the change is already deployed, run:
```bash
LIVE_URL="<live URL>" EXPECT_TEXT="<stable visible text>" npm run verify:deploy
```

## 5. Review diff and commit
Before committing:
```bash
git diff --check
git status --short
```

Commit with a conventional message:
- `fix: ...` for corrections,
- `feat: ...` for user-visible additions,
- `docs: ...` for documentation/runbook-only changes,
- `chore: ...` for maintenance/tooling.

## 6. Push, wait, and verify
1. Push `main` or open a PR if the repo requires review.
2. Wait for GitHub Actions deploy to complete.
3. Verify the live URL contains the expected current copy:
   ```bash
   LIVE_URL="<live URL>" \
   EXPECT_TEXT="<stable visible text>" \
   REPO="<owner>/<repo>" \
   npm run verify:deploy
   ```
4. Confirm final status:
   ```bash
   git status --short --branch
   ```

## 7. Handoff format
Return:
- Status: SUCCESS/PARTIAL/BLOCKED
- Commit SHA
- Files added/changed
- Checks run/results
- Deployment run URL/result
- Live verification evidence
- Summary of change
- Caveats/next steps

## 8. Rollback
If live verification fails after a successful push:
1. Identify whether the issue is build/deploy delay, broken content, or Pages configuration.
2. Prefer a forward fix if small and clear.
3. Otherwise revert the problematic commit, run QA, push, and verify again.
4. Do not rewrite public history unless explicitly approved.
