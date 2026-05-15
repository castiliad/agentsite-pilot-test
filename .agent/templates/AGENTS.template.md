# AGENTS.md

## Mission
[PROJECT_NAME] is [one-sentence truthful description of the site/service].

## Stack
- [FRAMEWORK_OR_GENERATOR] static site
- [QA_TOOLING] production build checks
- GitHub Pages via GitHub Actions
- Lightweight repo-local scripts in `scripts/`

## Safe edit boundaries
Agents may safely edit:
- `src/components/**`, `src/pages/**`, `src/styles/**` or equivalent site source paths
- Copy that remains consistent with `.agent/site.contract.yaml` and `.agent/brand.contract.yaml`
- Lightweight QA scripts when adding matching checks to `package.json`
- Documentation, runbooks, and plan files that reflect actual behavior

## Approval-required changes
Get explicit human approval before:
- Adding analytics, cookies, tracking pixels, or third-party forms
- Adding payment links or enabling payment mode
- Configuring custom domains or DNS
- Making unsupported claims, customer references, benchmarks, or availability promises
- Changing deployment target away from GitHub Pages
- Introducing server-side runtime or a database

## QA commands
Run before handoff:
```bash
npm run qa
```

Individual gates:
```bash
npm run check:contract
npm run check:claims
npm run check:seo
npm run check:links
npm run build
```

## Feature-request process
1. Capture the natural-language request as a short brief.
2. Compare it with `.agent/site.contract.yaml`, `.agent/brand.contract.yaml`, and `.agent/payment.contract.yaml`.
3. Record assumptions and acceptance criteria in an issue or plan file.
4. Implement the smallest coherent change.
5. Run QA and include command output summary in the handoff.
6. Deploy only after checks pass.
7. Verify the live URL contains expected current copy.

## Maintenance role
A maintenance agent owns recurring health review:
- Verify build, links, and deploy status.
- Check whether visible copy still matches the contracts.
- Keep no-payment mode intact unless approved.
- Convert vague requests into scoped tasks.
- Report drift, blockers, and recommended improvements without fabricating progress.
