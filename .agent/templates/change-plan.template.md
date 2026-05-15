# Change plan: [CHANGE_TITLE]

## Request
[Paste the requester language or concise summary.]

## Assumptions
- [Safe, reversible assumption.]
- No approval-required areas from `AGENTS.md` are touched unless approval is recorded here.

## Scope
- [What will change.]

## Non-goals
- [What will not change.]

## Files expected to change
- `[path]` — [reason]

## Acceptance criteria
- [Observable criterion.]
- Site copy remains aligned with `.agent/site.contract.yaml` and `.agent/brand.contract.yaml`.
- Payment mode remains disabled unless an approved contract update says otherwise.

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

## Rollback
- Revert the change commit, rerun QA, push to `main`, and verify the live URL again.

## Follow-up
- [Optional next step.]
