# AgentSite generator runbook

Use `npm run create:agentsite` to create a new AgentSite starter from a natural-language brief. The generator is safe by default: it only writes local files under `--out` unless `--publish` is explicitly passed.

## Local scaffold only
```bash
npm run create:agentsite -- \
  --name "Example AgentSite" \
  --repo example-agentsite \
  --owner castiliad \
  --brief "A concise static landing page for an example project." \
  --out /tmp/example-agentsite
```

Then validate locally:
```bash
cd /tmp/example-agentsite
npm install
npm run qa
```

Expected live URL printed by the generator:
```text
https://castiliad.github.io/example-agentsite/
```

## Config-driven scaffold
Use `--config <path>` to provide richer JSON input without adding dependencies. CLI flags override config values, so a shared config can be reused with `--repo`, `--name`, or `--out` overrides.

```bash
npm run create:agentsite -- \
  --config .agent/templates/sample.agentsite.config.json \
  --out /tmp/harbor-notes-agentsite \
  --force

cd /tmp/harbor-notes-agentsite
npm install
npm run qa
```

Supported JSON fields:
- `name`, `repo`, `owner`, `description`, `brief`
- `heroHeadline`, `heroLede`: optional visible hero copy overrides; without them the generator derives concise, user-facing copy instead of reusing raw instruction text
- `primaryCtaLabel`, `primaryCtaHref`
- `audience`: string array
- `visualDirection`: string
- `sections`: array of `{ "id", "title", "body", "navLabel" }`; ids must start with a lowercase letter and use lowercase letters, numbers, and dashes; `navLabel` is optional and should be short
- `proofArtifacts`: array of `{ "label", "body" }`
- `allowedClaims`, `forbiddenClaims`, `approvalRequired`: string arrays

Validation fails with a clear message for invalid JSON, missing merged `name`/`repo`/`brief`, invalid or duplicate section ids, and `--publish` without `--owner` after config/CLI merge.

## Overwrite a disposable local directory
```bash
npm run create:agentsite -- \
  --name "Disposable AgentSite" \
  --repo disposable-agentsite \
  --owner castiliad \
  --brief "A disposable smoke-test site." \
  --out /tmp/disposable-agentsite \
  --force
```

## Publish mode
Only use publish mode when you intentionally want a public GitHub repository created and pushed:
```bash
npm run create:agentsite -- \
  --name "Published AgentSite" \
  --repo published-agentsite \
  --owner castiliad \
  --brief "A public static landing page for a published AgentSite smoke test." \
  --out /tmp/published-agentsite \
  --publish
```

Publish mode requires:
- authenticated GitHub CLI (`gh auth status` passes),
- `git`, `npm`, and network access,
- permission to create `OWNER/REPO`.

Publish mode initializes git, installs dependencies, runs `npm run qa`, commits, creates a public GitHub repo with `gh repo create`, pushes `main`, and makes a best-effort Pages workflow setup. Some GitHub org policies may still require manual Pages settings review.

## Generated project contents
- Astro static site skeleton in `src/`
- `AGENTS.md`
- `.agent/site.contract.yaml`, `.agent/brand.contract.yaml`, `.agent/payment.contract.yaml`
- `.agent/runbooks/deploy.md` and `.agent/runbooks/feature-request.md`
- `.hermes/plans/initial-site-build.md`
- `.github/workflows/deploy.yml`
- QA scripts in `scripts/`
- `README.md`, `package.json`, `astro.config.mjs`, `.gitignore`

## Safety notes
- Payment remains disabled/no-payment in generated contracts.
- No analytics, tracking, custom domains, server runtime, or database are added.
- The generated site is a safe starter. Future agents should refine copy and design against the brief and contracts.
