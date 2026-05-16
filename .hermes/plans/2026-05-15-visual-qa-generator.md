# Visual/browser QA for AgentSite generator

## Scope
- Add dependency-light Playwright-based visual QA to the pilot repo and every newly generated AgentSite repo.
- Keep the default `npm run qa` fast and static/build-focused.
- Add an explicit browser gate for desktop and mobile smoke review with screenshot artifacts.
- Document usage in README and generator runbook.

## Acceptance criteria
- `npm run test:visual` builds the Astro site, serves the production build locally, visits desktop and mobile viewports, and writes screenshots to `.agent/audits/screenshots/`.
- The visual QA fails on browser console errors, page errors, horizontal overflow, missing/invisible hero `h1`, missing/invisible primary nav, missing/invisible primary CTA, visible nav ellipsis (`...` or `…`), and broken internal hash anchors.
- `npm run qa` remains unchanged as the fast gate; `npm run qa:full` runs static QA plus visual QA.
- Generated repos include `scripts/visual-qa.mjs`, Playwright devDependency, `test:visual`, and `qa:full` scripts.
- Docs explain first-time browser installation with `npx playwright install chromium` if needed.
- Pilot and a config-driven generated local site pass `npm run qa`, `npm run test:visual`/`qa:full`, `npm audit --audit-level=moderate`, and `git diff --check`.

## Exact files expected to change
- `package.json`
- `package-lock.json`
- `scripts/visual-qa.mjs`
- `scripts/create-agentsite.mjs`
- `README.md`
- `.agent/runbooks/generator.md`
- `.hermes/plans/2026-05-15-visual-qa-generator.md`

## QA commands
```bash
npm install
npx playwright install chromium
npm run qa
npm run test:visual
npm run qa:full
npm audit --audit-level=moderate
git diff --check
npm run create:agentsite -- --config .agent/templates/sample.agentsite.config.json --out /tmp/agentsite-visual-qa-test --force
cd /tmp/agentsite-visual-qa-test
npm install
npx playwright install chromium
npm run qa
npm run test:visual
```

## Test approach
- Use a single Node script instead of pixel snapshots to avoid brittle diffs.
- Build once, run `astro preview` on a local loopback port, and use Playwright Chromium to inspect the rendered production site.
- Capture full-page desktop and mobile screenshots for human review.
- Programmatically check layout invariants and anchors for fast failure signals.

## Caveats
- First-time machines may need `npx playwright install chromium` before running browser QA.
- The gate is a smoke test, not a full accessibility or cross-browser matrix.
- It does not compare screenshots to baselines; it catches structural/layout regressions and preserves artifacts for review.
