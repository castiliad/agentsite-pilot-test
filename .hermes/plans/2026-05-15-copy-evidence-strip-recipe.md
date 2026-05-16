# Add executable copy-evidence-strip recipe

## Request
Proceed with adding a second AgentSite recipe after `product-cockpit` and deterministic recipe selection.

## Scope
- Add `copy-evidence-strip` recipe docs and acceptance criteria.
- Make generator copy recipe metadata into generated repos.
- Make generator render a visible claim-to-artifact strip when selected explicitly.
- Let auto recipe selection choose `copy-evidence-strip` from proof/copy/trust/evidence signals.
- Add example configs for explicit and auto selection.
- Verify registry scoring, generated local QA, published disposable deploy, and live content.

## Non-goals
- No backend, analytics, payment, customer proof, fake metrics, fake logos, or testimonials.
- Do not remove or weaken `product-cockpit` behavior.
- Do not publish unless using an explicit disposable proof repo.

## Acceptance criteria
- `npm run list:recipes` lists two recipes.
- `npm run score:recipes -- --fail-below-threshold` passes.
- Explicit `recipes:["copy-evidence-strip"]` generates the strip in default layout.
- `recipes:["product-cockpit", "copy-evidence-strip"]` composes cockpit + strip.
- `autoRecipes:true` can select `copy-evidence-strip` from evidence/trust language.
- Generated site passes `npm run qa:full` and deploy verification.
