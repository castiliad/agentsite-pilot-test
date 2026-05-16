# Product Cockpit acceptance checklist

Use this checklist before claiming that `product-cockpit` has been applied.

## Fit

- [ ] The selected recipe is recorded in the plan, config, README, AGENTS notes, or site contract.
- [ ] The page has a clear audience, promise, and primary CTA.
- [ ] Cockpit-style panels make the brief easier to understand rather than adding decorative noise.

## Truthfulness

- [ ] Every visible claim is supported by user-provided facts, repo-local artifacts, or existing contracts/runbooks.
- [ ] Metrics, testimonials, logos, screenshots, and customer proof are absent unless explicitly provided and verified.
- [ ] Draft, planned, proposed, or not-yet-live items are labeled honestly.

## Static safety

- [ ] The implementation remains static and compatible with GitHub Pages.
- [ ] No analytics, tracking pixels, cookies, payment links, auth, database, server runtime, or live data feeds were added.
- [ ] No-payment mode remains intact unless a revised payment contract explicitly approves a change.

## Structure

- [ ] Hero section states the main value and next step.
- [ ] Operating context explains the decision this page helps visitors make.
- [ ] Cockpit panels cover status, workflow, proof, constraints, and/or handoff evidence.
- [ ] Proof section points to artifacts that actually exist or facts that were provided.
- [ ] Boundary section makes approval-required or unavailable capabilities explicit.

## QA

- [ ] `npm run list:recipes` lists `product-cockpit`.
- [ ] `npm run score:recipes` reports a passing registry score for `product-cockpit`.
- [ ] `npm run qa` passes.
- [ ] `npm run test:visual` passes when browser QA is available.
- [ ] `git diff --check` reports no whitespace errors before commit.
