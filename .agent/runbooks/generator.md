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
