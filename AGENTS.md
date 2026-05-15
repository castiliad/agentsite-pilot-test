# AGENTS.md

## Mission
AgentSite Pilot is a premium static landing page for an experimental workflow: a person asks for a website in natural language and receives an agent-maintained GitHub Pages link with source, contracts, QA, and deployment evidence.

## Stack
- Astro static site
- Astro production build checks
- GitHub Pages via GitHub Actions
- Lightweight Node.js QA scripts in `scripts/`

## Safe edit boundaries
Agents may safely edit:
- `src/components/**`, `src/pages/**`, `src/styles/**`
- Copy that remains consistent with `.agent/site.contract.yaml` and `.agent/brand.contract.yaml`
- Lightweight QA scripts when adding matching checks to `package.json`
- Documentation and runbooks that reflect actual behavior

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
2. Compare it with `.agent/site.contract.yaml` and `.agent/brand.contract.yaml`.
3. Record assumptions and acceptance criteria in an issue or plan file.
4. Implement the smallest coherent change.
5. Run QA and include command output summary in the handoff.
6. Deploy only after checks pass.

## Chief of Staff website health role
A maintenance agent acting as Chief of Staff owns recurring health review:
- Verify build, links, and deploy status.
- Check whether visible copy still matches the contracts.
- Keep no-payment mode intact unless approved.
- Convert vague requests into scoped tasks.
- Report drift, blockers, and recommended improvements without fabricating progress.
