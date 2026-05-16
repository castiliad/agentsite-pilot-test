# Executable product-cockpit rendering plan

## Request
Make the AgentSite generator render a product-cockpit UI when `recipes` includes `product-cockpit` or `visualPreset` is `cockpit-dark` / `product-cockpit`.

## Scope
- Add generator selection logic that keeps the default generated site unchanged unless the recipe/preset is selected.
- Add product-cockpit `index.astro` and `global.css` builder helpers that consume config data: name, description/headline/lede/brief, audience, sections, proof artifacts, allowed/forbidden claims, approval-required boundaries, and primary CTA.
- Keep output static-safe: no analytics, payments, auth, backend, live telemetry, fake metrics, customer logos, or testimonials.
- Document recipe-enabled generation and provide a sample config.
- Smoke test a generated scaffold with `npm run qa:full`.

## Acceptance criteria
- `npm run list:recipes`, `npm run score:recipes`, `npm run qa`, `npm run test:visual`, `npm audit --audit-level=moderate`, and `git diff --check` pass in the pilot repo.
- Product-cockpit generated scaffold passes `npm run qa:full`.
- Default generation path remains selected only when no cockpit recipe/preset is configured.
- Changes are committed, pushed, deployed by GitHub Actions, and verified live.

## Notes
- The cockpit treatment is strongest for technical/product-reviewer audiences; generated copy should explain the user-facing workflow early and avoid over-heavy dashboard language.
