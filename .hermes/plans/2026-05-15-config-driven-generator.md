# Config-driven AgentSite generator plan

## Scope
- Extend `scripts/create-agentsite.mjs` with optional `--config <path>` JSON input.
- Merge config and CLI flags with CLI taking precedence.
- Use richer brief fields to generate site-specific hero, sections, CTA, proof/artifacts, contracts, and `AGENTS.md` guardrails.
- Keep the generator dependency-light: Node built-ins only, JSON only (no YAML parser dependency).
- Preserve safe-by-default local-only behavior unless `--publish` is explicitly set.

## Acceptance criteria
- Existing CLI-only generation still works.
- Config-driven generation works with JSON fields: `name`, `repo`, `owner`, `description`, `brief`, `primaryCtaLabel`, `primaryCtaHref`, `audience`, `visualDirection`, `sections`, `proofArtifacts`, `allowedClaims`, `forbiddenClaims`, `approvalRequired`.
- CLI flags override config values.
- Generator fails clearly on invalid JSON, missing merged `name`/`repo`/`brief`, invalid section ids, or `--publish` without owner.
- Generated page renders configured sections and proof artifacts, with restrained responsive styling.
- Generated contracts/AGENTS include audience, allowed/forbidden claims, approval boundaries where practical.
- Payment remains disabled; no fake testimonials/logos/metrics are introduced.
- README and `.agent/runbooks/generator.md` document config usage.

## Exact files expected to change
- `scripts/create-agentsite.mjs`
- `.agent/runbooks/generator.md`
- `README.md`
- `.agent/templates/sample.agentsite.config.json`
- `.hermes/plans/2026-05-15-config-driven-generator.md`

## QA commands
```bash
rm -rf /tmp/agentsite-cli-only-test /tmp/agentsite-config-test
npm run create:agentsite -- --name "CLI Only AgentSite" --repo cli-only-agentsite --owner castiliad --brief "A concise static landing page for validating the CLI-only AgentSite generator path." --out /tmp/agentsite-cli-only-test --force
cd /tmp/agentsite-cli-only-test && npm install && npm run qa
cd /home/alxndrc/agentsite-pilot-test
npm run create:agentsite -- --config .agent/templates/sample.agentsite.config.json --out /tmp/agentsite-config-test --force
cd /tmp/agentsite-config-test && npm install && npm run qa
cd /home/alxndrc/agentsite-pilot-test
npm run qa
npm audit --audit-level=moderate
git diff --check
```

## Test approach
- Generate one site using only legacy CLI flags to protect backwards compatibility.
- Generate one site using the sample config to confirm richer copy, sections, proof artifacts, contracts, and nav anchors compile.
- Run each generated site's `npm install && npm run qa`.
- Run pilot repo QA, audit, and whitespace checks before commit/push.
- Verify GitHub Pages after push with `npm run verify:deploy`.

## Caveats
- Config is intentionally shallow JSON rather than a formal JSON Schema dependency.
- The generator validates structure and high-risk fields, but human review is still required for claim truthfulness.
- Publish mode still depends on authenticated `gh`, repo creation permissions, and GitHub Pages workflow availability.
