# Change plan: hero proof/control-plane clarity

## Request
Make the hero clearer and add a stronger proof/control-plane section. The page should quickly communicate what the system does, show the actual handoff artifacts a user gets back, and make the agent-maintained workflow feel concrete while keeping the premium restrained developer/control-plane aesthetic.

## Assumptions
- This remains a static Astro landing page deployed to GitHub Pages.
- No analytics, payments, fake customers, fake metrics, testimonials, or unsupported claims will be added.
- Existing contracts already allow clearer copy and a strengthened control-plane section.
- Visual QA will be code/build based in this subagent; parent can perform browser screenshot review if needed.

## Files expected to change
- `src/pages/index.astro` — hero copy and terminal summary.
- `src/components/ControlPlane.astro` — concrete handoff artifact/control-plane section.
- `src/styles/global.css` — focused styling for the artifact grid/status panel.
- `.hermes/plans/2026-05-15-hero-proof-control-plane.md` — this plan.
- `.agent/runbooks/deploy.md` — only if hero verification copy changes and runbook must stay truthful.

## Acceptance criteria
- Hero answers within ~5 seconds:
  - what it is: natural-language website request to an agent-maintained static site,
  - what the user receives: repo, Pages URL, contracts, QA/deploy evidence, next-change plan,
  - why trust it: contract-backed, verifiable QA, deploy evidence, no fake proof.
- Control-plane/proof section explicitly lists concrete handoff artifacts:
  - GitHub repo,
  - Pages URL,
  - `AGENTS.md`,
  - `.agent` contracts,
  - QA report,
  - deploy run,
  - next-change plan.
- Design remains restrained, responsive, and coherent with the existing dark developer/control-plane aesthetic.
- Contracts remain truthful and no approval-required areas are touched.

## QA commands
```bash
npm run qa
npm audit --audit-level=moderate
```

## Deploy/verify
- Commit with conventional commit message.
- Push to `main`.
- Wait for GitHub Actions Pages workflow to succeed.
- Verify live URL contains new hero/control-plane copy.
- Confirm `git status` is clean.
