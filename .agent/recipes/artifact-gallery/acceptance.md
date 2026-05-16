# Artifact Gallery Acceptance Checklist

- [ ] Recipe is recorded as `artifact-gallery` in the selected recipes list when used.
- [ ] `src/data/artifacts.json` exists and contains at least three public-safe artifacts.
- [ ] Each artifact has title, type, tags, href, and summary.
- [ ] Search filters visible cards without console errors.
- [ ] Tag chips filter cards and preserve active tag in the URL query string.
- [ ] Keyboard focus is visible on search, buttons, and links.
- [ ] Mobile layout has no horizontal overflow.
- [ ] No artifact links to secrets, private data, payment providers, analytics, or tracking domains.
- [ ] No fake metrics, fake customers, unsupported guarantees, or invented proof.
- [ ] `npm run check:artifacts` and `npm run qa:full` pass.
