# TODO: Push the bounds of static-site ambition

## Intent

Explore how far a static AgentSite can be pushed, starting with low-complexity upgrades and escalating until autonomous agents can no longer effectively maintain the project.

The goal is not just to make a nicer landing page. The goal is to create a controlled stress test for agent-maintained static software: richer UX, more generated artifacts, more state, more data, more interactions, more design surfaces, and eventually scenarios that are only practical with highly intelligent AI assistance.

## Core rule

Increase complexity one layer at a time. Each layer must leave behind:

- contract updates in `AGENTS.md` / `.agent/**`
- implementation notes or recipe docs
- QA gates or evals for the new behavior
- visual/browser verification
- a clear rollback path
- a maintainer verdict: easy / manageable / strained / brittle / agent failure

## Complexity ladder

### 0. Baseline: agent-operable static site

- Astro static build
- GitHub Pages deploy
- contracts, runbooks, plans
- fast QA and visual QA
- recipe registry

Exit criteria: current system remains green.

### 1. True visual divergence

Status: in progress / first implementation completed in `.hermes/plans/2026-05-15-layer-1-archetype-divergence.md`.

Add real archetype + visual-preset separation so generated sites stop looking identical.

TODO:

- classify patterns as `archetype`, `section_recipe`, or `visual_preset`
- add a full-page second archetype such as `editorial-ledger` or `artifact-gallery`
- keep `copy-evidence-strip` as a section recipe
- add visual presets with materially different tokens/layout rhythm
- add visual regression checks that catch recipe sameness

Failure signal: agents cannot tell whether a recipe changed structure, style, or only content.

### 2. Rich static interaction layer

Add interactions that require no backend but feel app-like.

TODO candidates:

- filterable/searchable artifact gallery
- local checklist/progress state via `localStorage`
- theme/style switcher
- command palette
- keyboard shortcuts
- collapsible evidence graph
- compare views / before-after panels

Failure signal: agents introduce inaccessible controls, broken mobile behavior, or state bugs not covered by QA.

### 3. Local-first mini app

Use browser storage and client-side state while staying fully static.

TODO candidates:

- IndexedDB/OPFS-backed notes or artifact annotations
- local-first project roadmap editor
- browser-only site brief builder
- export/import JSON contract bundle
- offline PWA behavior via service worker

Failure signal: agents cannot maintain schema migrations, persistence tests, offline behavior, or data-loss guardrails.

### 4. Data-heavy static intelligence

Precompute complex data at build time and serve it statically.

TODO candidates:

- static search index over docs/recipes/plans
- generated knowledge graph of site claims → evidence → source files
- local semantic search using precomputed embeddings or WASM search
- static dashboards generated from repo history, plans, QA output, screenshots

Failure signal: agents hallucinate data provenance, break build-time generation, or cannot keep derived artifacts synced with source.

### 5. Browser-native media/computation

Push heavy browser APIs while keeping hosting static.

TODO candidates:

- image/PDF processing in-browser via WASM
- visual diff viewer for screenshots
- client-side charting and canvas interactions
- timeline animation system
- audio/video artifact viewer
- optional WebGPU/WebGL experiments with reduced-motion fallback

Failure signal: performance regressions, weak fallbacks, unmaintainable rendering code, or excessive dependency drift.

### 6. Agent-operable design lab

Make the site itself a pattern/workflow lab future agents can extend.

TODO candidates:

- pattern lab pages for every recipe/archetype/preset
- auto-generated screenshots per pattern
- recipe composition matrix
- visual similarity scoring between generated sites
- agent-readable design tokens and component contracts
- automated critique report after each generated site

Failure signal: agents can add patterns but cannot keep docs, screenshots, contracts, and generator behavior consistent.

### 7. Static autonomous operations center

Build a static interface that feels like an operations product, with all dynamic behavior simulated from static artifacts or local state.

TODO candidates:

- mission control dashboard for generated sites
- repo health timeline from build/deploy/QA artifacts
- task decomposition viewer
- subagent handoff explorer
- decision log and risk register
- local scenario simulator for feature requests

Failure signal: agents blur static simulated status with live status or cannot prevent misleading operational claims.

### 8. Extreme challenge: impossible-without-AI static knowledge product

Attempt a static site that continuously accretes complex, cross-linked knowledge and high-quality UI surfaces from many autonomous agent contributions.

Possible target:

> A static “AgentSite Atlas” that ingests briefs, recipes, generated screenshots, QA reports, plans, claim/evidence graphs, visual critiques, component docs, and change requests, then builds a browsable local-first operating system for understanding and improving every generated site.

Ambitious features:

- generated multi-page documentation + visual pattern lab
- claim/evidence provenance graph
- recipe recommender with explainable scoring
- design-similarity detector to avoid samey outputs
- local-first annotations and review queues
- offline PWA
- static search over all artifacts
- screenshot galleries and visual diffs
- build-time generated diagrams
- agent-maintained challenge benchmarks
- “agent failure log” showing where maintenance broke down

Failure signal: agents can no longer reason across the contracts, generator, recipes, visual outputs, derived data, and QA gates without creating contradictions or stale artifacts.

## Measurement rubric

After each layer, record:

- complexity added
- files/surfaces touched
- new dependencies
- new QA gates
- visual QA result
- accessibility/performance result if available
- how many agent passes were needed
- what confused the agent
- whether future maintenance is still realistic

Verdict labels:

```text
easy       = one agent can safely maintain
manageable = needs careful plans and QA
strained   = agents often need review/fixes
brittle    = small edits cause regressions
failure    = autonomous maintenance no longer trustworthy
```

## Immediate next step when resumed

Do **not** add more shallow section recipes first.

Start with Layer 1:

1. Add `archetype`, `section_recipe`, and `visual_preset` taxonomy to recipe contracts.
2. Convert `copy-evidence-strip` into an explicit section recipe.
3. Add a true second full-page archetype, likely `editorial-ledger` or `artifact-gallery`.
4. Add a visual-similarity/sameness check so future generated sites are evaluated for meaningful visual divergence.
