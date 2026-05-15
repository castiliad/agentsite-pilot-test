# AgentSite generator first pass

## Scope
- Add a dependency-light repo-local generator command for creating a new static AgentSite project from the pilot pattern.
- Default behavior is local scaffold only; no GitHub/network side effects unless `--publish` is explicitly provided.
- Generated projects should include Astro static site basics, AgentSite guardrails, contracts, runbooks, QA scripts, GitHub Pages workflow, and deployment verification tooling.

## Non-goals
- Do not create the second disposable test site in GitHub; parent agent will run that separately.
- Do not enable payments, analytics, custom domains, databases, or server runtime.
- Do not attempt complex natural-language design generation beyond safe first-pass copy derived from the brief.

## Acceptance criteria
- `npm run create:agentsite -- --name ... --repo ... --brief ... --out ...` creates a local project.
- Required CLI args: `--name`, `--repo`, `--brief`, `--out`; optional `--owner`, `--description`, `--publish`, `--force`.
- Publish is false by default and prints next commands plus expected live URL.
- Generated project includes `AGENTS.md`, `.agent/**`, `.hermes/plans/initial-site-build.md`, `.github/workflows/deploy.yml`, `src/**`, `scripts/**`, `README.md`, `package.json`, `astro.config.mjs`, and `.gitignore`.
- Payment contract remains disabled/no-payment.
- Pilot repo QA passes after changes.
- Dry-run/local generated site validates with install/QA if practical.

## Exact files expected to change
- Add `.hermes/plans/2026-05-15-agentsite-generator.md`
- Add `scripts/create-agentsite.mjs`
- Add `.agent/runbooks/generator.md`
- Update `package.json`
- Update `README.md`

## QA commands
```bash
npm run create:agentsite -- --name "Disposable AgentSite" --repo disposable-agentsite-local --brief "A concise static landing page for a disposable AgentSite generator smoke test." --owner castiliad --out /tmp/disposable-agentsite-local --force
cd /tmp/disposable-agentsite-local && npm install && npm run qa
npm run qa
npm audit --audit-level=moderate
LIVE_URL="https://castiliad.github.io/agentsite-pilot-test/" EXPECT_TEXT="Ask for a website in natural language" REPO="castiliad/agentsite-pilot-test" npm run verify:deploy
```

## Test approach
- Static validation through generated project QA scripts.
- Run generator in local-only mode under `/tmp` with `--force` to avoid touching real repos.
- Run pilot repo QA/audit and deployment verifier after commit/push.

## Caveats
- The generator makes a safe starter, not a finished bespoke site.
- Publish mode shells out to `gh`, `git`, and `npm`; it requires authenticated GitHub CLI and normal repo permissions.
- GitHub Pages enablement is best-effort through workflow deployment; manual repo Pages settings may still be needed in some org policies.
