# Generator visual/content polish

## Context
Visual QA of the config-driven Harbor Notes output showed the generator worked end-to-end but exposed content polish issues: oversized hero copy from long descriptions/briefs, instruction-style hero ledes, and mechanically truncated navigation labels.

## Scope
- Add optional `heroHeadline` and `heroLede` config/CLI fields for explicit hero copy.
- Add optional `sections[].navLabel` for concise navigation labels.
- Improve fallback hero and navigation copy so generated visible text avoids raw generator instructions and literal ellipses.
- Update sample config and generator documentation.

## Acceptance criteria
- `node --check scripts/create-agentsite.mjs` passes.
- Config-driven Harbor Notes generation passes generated-site QA.
- Generated `src/pages/index.astro` does not show `Create a restrained` in hero visible copy and nav labels do not contain literal ellipses.
- Pilot repo QA, audit, and whitespace checks pass before commit/deploy.
