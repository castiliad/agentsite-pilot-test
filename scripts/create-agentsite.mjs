#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { recommendRecipes } from './recipe-selector.mjs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rawArgs = parseArgs(process.argv.slice(2));
if (rawArgs.help || rawArgs.h) usage(0);

const config = rawArgs.config ? loadConfig(rawArgs.config) : {};
const args = mergeConfigAndArgs(config, rawArgs);
const required = ['name', 'repo', 'brief', 'out'];
const missing = required.filter((key) => !present(args[key]));
if (missing.length) fail(`Missing required value(s) after merging config and CLI flags: ${missing.map((key) => `--${kebab(key)}`).join(', ')}`);

const projectName = cleanText(args.name, 'name');
const repoName = slug(String(args.repo));
const ownerProvided = present(args.owner);
const owner = ownerProvided ? slug(String(args.owner)) : 'your-github-owner';
const brief = cleanText(args.brief, 'brief');
const description = present(args.description) ? cleanText(args.description, 'description') : sentenceFromBrief(brief, projectName);
const publish = Boolean(args.publish);
const force = Boolean(args.force);
const outDir = path.resolve(String(args.out));
const packageName = repoName;
const liveUrl = `https://${owner}.github.io/${repoName}/`;
const repoUrl = `https://github.com/${owner}/${repoName}`;
const today = new Date().toISOString().slice(0, 10);
const audience = normalizeStringArray(args.audience, 'audience', defaultAudience(projectName));
const visualDirection = present(args.visualDirection) ? cleanText(args.visualDirection, 'visualDirection') : 'restrained premium static-site landing page with crisp editorial spacing';
const explicitRecipeSelection = hasOwn(config, 'recipes') || hasOwn(rawArgs, 'recipes');
const explicitVisualPreset = hasOwn(config, 'visualPreset') || hasOwn(rawArgs, 'visualPreset');
const explicitArchetype = hasOwn(config, 'archetype') || hasOwn(rawArgs, 'archetype');
const autoRecipesRequested = Boolean(args.autoRecipes);
let selectedRecipes = normalizeOptionalStringArray(args.recipes, 'recipes');
let visualPreset = present(args.visualPreset) ? cleanText(args.visualPreset, 'visualPreset') : '';
let archetype = present(args.archetype) ? cleanText(args.archetype, 'archetype') : '';
const primaryCtaLabel = present(args.primaryCtaLabel) ? cleanText(args.primaryCtaLabel, 'primaryCtaLabel') : 'Review next step';
const primaryCtaHref = present(args.primaryCtaHref) ? cleanHref(args.primaryCtaHref) : '#cta';
const sections = normalizeSections(args.sections, brief, audience);
const heroHeadline = present(args.heroHeadline) ? cleanText(args.heroHeadline, 'heroHeadline') : defaultHeroHeadline(projectName, description, brief, sections);
const heroLede = present(args.heroLede) ? cleanText(args.heroLede, 'heroLede') : defaultHeroLede(brief, description, projectName);
const proofArtifacts = normalizeProofArtifacts(args.proofArtifacts);
const autoRecipeSelection = buildAutoRecipeSelection();
if (autoRecipeSelection.applied) {
  selectedRecipes = autoRecipeSelection.selectedRecipes;
  visualPreset = autoRecipeSelection.visualPreset;
  archetype = autoRecipeSelection.archetype;
}
const allowedClaims = normalizeStringArray(args.allowedClaims, 'allowedClaims', [
  'Static GitHub Pages delivery',
  'Repo-local QA scripts',
  'Contract-backed maintenance boundaries',
  'Payment disabled / no-payment mode'
]);
const forbiddenClaims = normalizeStringArray(args.forbiddenClaims, 'forbiddenClaims', [
  'fake customer testimonials',
  'fake metrics',
  'unsupported guarantees',
  'analytics or tracking',
  'live payment links'
]);
const approvalRequired = normalizeStringArray(args.approvalRequired, 'approvalRequired', [
  'Adding analytics, cookies, tracking pixels, or third-party forms',
  'Adding payment links or enabling payment mode',
  'Configuring custom domains or DNS',
  'Making unsupported claims, customer references, benchmarks, or availability promises',
  'Changing deployment target away from GitHub Pages',
  'Introducing server-side runtime or a database'
]);
const usesEditorialLedger = shouldRenderEditorialLedger(selectedRecipes, visualPreset, archetype);
const usesProductCockpit = !usesEditorialLedger && shouldRenderProductCockpit(selectedRecipes, visualPreset, archetype);
const usesCopyEvidenceStrip = shouldRenderCopyEvidenceStrip(selectedRecipes, visualPreset);
const usesArtifactGallery = shouldRenderArtifactGallery(selectedRecipes, visualPreset);
const usesRoadmapBoard = shouldRenderRoadmapBoard(selectedRecipes, visualPreset);
const usesSearchIndex = shouldRenderSearchIndex(selectedRecipes, visualPreset);
const usesAgentSiteAtlas = shouldRenderAgentSiteAtlas(selectedRecipes, visualPreset);
const usesAgentRunLedger = shouldRenderAgentRunLedger(selectedRecipes, visualPreset);
const usesFeatureRequestInbox = shouldRenderFeatureRequestInbox(selectedRecipes, visualPreset);
const usesChiefOfStaffBriefing = shouldRenderChiefOfStaffBriefing(selectedRecipes, visualPreset);
if (usesArtifactGallery && sections.some((section) => section.id === 'artifacts')) {
  fail('Section id "artifacts" is reserved when artifact-gallery is selected. Rename the configured section id.');
}
if (usesRoadmapBoard && sections.some((section) => section.id === 'roadmap')) {
  fail('Section id "roadmap" is reserved when roadmap-board is selected. Rename the configured section id.');
}
if (usesSearchIndex && sections.some((section) => section.id === 'search')) {
  fail('Section id "search" is reserved when search-index is selected. Rename the configured section id.');
}
if (usesAgentSiteAtlas && sections.some((section) => section.id === 'atlas')) {
  fail('Section id "atlas" is reserved when agentsite-atlas is selected. Rename the configured section id.');
}
if (usesAgentRunLedger && sections.some((section) => section.id === 'runs')) {
  fail('Section id "runs" is reserved when agent-run-ledger is selected. Rename the configured section id.');
}
if (usesFeatureRequestInbox && sections.some((section) => section.id === 'requests')) {
  fail('Section id "requests" is reserved when feature-request-inbox is selected. Rename the configured section id.');
}
if (usesChiefOfStaffBriefing && sections.some((section) => section.id === 'briefing')) {
  fail('Section id "briefing" is reserved when chief-of-staff-briefing is selected. Rename the configured section id.');
}
const activeArchetype = usesEditorialLedger ? 'editorial-ledger' : usesProductCockpit ? 'product-cockpit' : 'default-landing';

if (!projectName) fail('--name cannot be empty');
if (!brief) fail('--brief cannot be empty');
if (!repoName || !/^[a-z0-9._-]+$/.test(repoName)) fail('--repo must be URL/package safe after slugging (letters, numbers, dot, underscore, dash)');
if (publish && !ownerProvided) fail('--owner is required when --publish is set');

if (fs.existsSync(outDir)) {
  const entries = fs.readdirSync(outDir);
  if (entries.length && !force) fail(`Output directory exists and is not empty: ${outDir}\nUse --force to replace it.`);
  if (force) fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

const view = {
  PROJECT_NAME: projectName,
  REPO_NAME: repoName,
  PACKAGE_NAME: packageName,
  OWNER: owner,
  BRIEF: brief,
  DESCRIPTION: description,
  LIVE_URL: liveUrl,
  REPO_URL: repoUrl,
  OWNER_REPO: `${owner}/${repoName}`,
  TODAY: today,
  EXPECT_TEXT: projectName,
  HERO: heroHeadline,
  HERO_LEDE: heroLede,
  PRIMARY_CTA_LABEL: primaryCtaLabel,
  PRIMARY_CTA_HREF: primaryCtaHref,
  AUDIENCE_LIST_MD: mdList(audience),
  APPROVAL_LIST_MD: mdList(approvalRequired),
  ALLOWED_CLAIMS_YAML: yamlList(allowedClaims, 4),
  FORBIDDEN_CLAIMS_YAML: yamlList(forbiddenClaims, 4),
  APPROVAL_REQUIRED_YAML: yamlList(approvalRequired, 2),
  AUDIENCE_YAML: yamlList(audience, 2),
  REQUIRED_SECTIONS_YAML: yamlList(['hero', ...sections.map((section) => section.id), ...(usesArtifactGallery ? ['artifacts'] : []), ...(usesRoadmapBoard ? ['roadmap'] : []), ...(usesSearchIndex ? ['search'] : []), ...(usesAgentSiteAtlas ? ['atlas'] : []), ...(usesAgentRunLedger ? ['runs'] : []), ...(usesFeatureRequestInbox ? ['requests'] : []), ...(usesChiefOfStaffBriefing ? ['briefing'] : []), 'proof', 'next_step_cta'], 2),
  VISUAL_DIRECTION: visualDirection,
  RECIPE_SELECTION_MD: selectedRecipes.length ? mdList(selectedRecipes) : '- None selected',
  RECIPE_SELECTION_YAML: selectedRecipes.length ? yamlList(selectedRecipes, 2) : '  []',
  RECIPE_SELECTION_INLINE: selectedRecipes.length ? selectedRecipes.join(', ') : 'none selected',
  ARCHETYPE: activeArchetype,
  ARCHETYPE_YAML: yamlScalar(activeArchetype),
  VISUAL_PRESET: visualPreset || 'none selected',
  VISUAL_PRESET_YAML: visualPreset ? yamlScalar(visualPreset) : 'null',
  AUTO_RECIPE_SELECTION: autoRecipeSelection.summary,
  AUTO_RECIPE_SELECTION_YAML: yamlScalar(autoRecipeSelection.summary),
  AUTO_RECIPE_REASON_MD: autoRecipeSelection.reasons.length ? mdList(autoRecipeSelection.reasons) : '- No auto-selection signals recorded',
  SECTIONS_SUMMARY_MD: mdList(sections.map((section) => `${section.title} (${section.id})`)),
  PROOF_SUMMARY_MD: mdList(proofArtifacts.map((item) => `${item.label}: ${item.body}`)),
  SITE_INDEX: usesEditorialLedger ? buildEditorialLedgerIndexAstro() : usesProductCockpit ? buildProductCockpitIndexAstro() : buildIndexAstro(),
  GLOBAL_CSS: `${usesEditorialLedger ? buildEditorialLedgerGlobalCss() : usesProductCockpit ? buildProductCockpitGlobalCss() : buildGlobalCss()}${usesCopyEvidenceStrip ? buildCopyEvidenceStripCss(usesEditorialLedger ? 'light' : 'dark') : ''}${usesArtifactGallery ? buildArtifactGalleryCss(usesEditorialLedger ? 'light' : 'dark') : ''}${usesRoadmapBoard ? buildRoadmapBoardCss(usesEditorialLedger ? 'light' : 'dark') : ''}${usesSearchIndex ? buildSearchIndexCss(usesEditorialLedger ? 'light' : 'dark') : ''}${usesAgentSiteAtlas ? buildAgentSiteAtlasCss(usesEditorialLedger ? 'light' : 'dark') : ''}${usesAgentRunLedger ? buildAgentRunLedgerCss(usesEditorialLedger ? 'light' : 'dark') : ''}${usesFeatureRequestInbox ? buildFeatureRequestInboxCss(usesEditorialLedger ? 'light' : 'dark') : ''}${usesChiefOfStaffBriefing ? buildChiefOfStaffBriefingCss(usesEditorialLedger ? 'light' : 'dark') : ''}`
};

const files = new Map(Object.entries({
  '.gitignore': `node_modules/\ndist/\n.astro/\n.DS_Store\n.env\n.env.*\n.agent/audits/screenshots/\n`,
  'package.json': JSON.stringify({
    name: view.PACKAGE_NAME,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'astro dev',
      build: 'astro build',
      preview: 'astro preview',
      qa: 'npm run check:contract && npm run check:claims && npm run check:seo && npm run check:links && npm run check:artifacts && npm run check:roadmap && npm run build:search-index && npm run check:search-index && npm run check:atlas && npm run check:runs && npm run check:requests && npm run build:briefing && npm run check:briefing && npm run build',
      'test:visual': 'node scripts/visual-qa.mjs',
      'qa:full': 'npm run qa && npm run test:visual',
      'check:contract': 'node scripts/check-contracts.mjs',
      'check:claims': 'node scripts/check-claims.mjs',
      'check:seo': 'node scripts/check-seo.mjs',
      'check:links': 'node scripts/check-links.mjs',
      'check:artifacts': 'node scripts/check-artifacts.mjs',
      'check:roadmap': 'node scripts/check-roadmap.mjs',
      'build:search-index': 'node scripts/build-search-index.mjs',
      'check:search-index': 'node scripts/check-search-index.mjs',
      'check:atlas': 'node scripts/check-atlas.mjs',
      'check:runs': 'node scripts/check-runs.mjs',
      'check:requests': 'node scripts/check-requests.mjs',
      'build:briefing': 'node scripts/build-briefing.mjs',
      'check:briefing': 'node scripts/check-briefing.mjs',
      'list:recipes': 'node scripts/list-recipes.mjs',
      'score:recipes': 'node scripts/score-recipes.mjs',
      'recommend:recipes': 'node scripts/recommend-recipes.mjs',
      'check:visual-divergence': 'node scripts/check-visual-divergence.mjs',
      'verify:deploy': 'node scripts/verify-deploy.mjs'
    },
    dependencies: { astro: '^6.3.3', typescript: '^6.0.3' },
    devDependencies: { '@playwright/test': '^1.60.0' }
  }, null, 2) + '\n',
  'astro.config.mjs': `// @ts-check\nimport { defineConfig } from 'astro/config';\n\nexport default defineConfig({\n  site: 'https://{{OWNER}}.github.io',\n  base: '/{{REPO_NAME}}',\n  output: 'static'\n});\n`,
  'README.md': `# {{PROJECT_NAME}}\n\n{{DESCRIPTION}}\n\n## Brief\n{{BRIEF}}\n\n## Recipe registry\nSelected recipes:\n{{RECIPE_SELECTION_MD}}\n\nVisual preset: \`{{VISUAL_PRESET}}\`\n\nauto_recipe_selection: {{AUTO_RECIPE_SELECTION}}\n\nAuto-selection signals:\n{{AUTO_RECIPE_REASON_MD}}\n\nRegistry commands:\n\`\`\`bash\nnpm run list:recipes\nnpm run score:recipes\nnpm run recommend:recipes -- --brief \"{{BRIEF}}\"\n\`\`\`\n\n## Audience\n{{AUDIENCE_LIST_MD}}\n\n## Live URL\n{{LIVE_URL}}\n\n## Repository\n{{REPO_URL}}\n\n## Local development\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## QA\n\`npm run qa\` is the fast local gate. Browser/mobile visual QA is explicit so normal edits stay quick.\n\n## Recipe-enabled generation\nSelecting \`recipes: [\"product-cockpit\"]\`, \`visualPreset: \"cockpit-dark\"\`, or \`visualPreset: \"product-cockpit\"\` renders the cockpit UI template instead of only recording metadata. The output remains static-safe: no analytics, payments, backend, authentication, live telemetry, fake metrics, customer logos, or quoted endorsements.\n\n\`\`\`bash\nnpm run qa\nnpm run test:visual\nnpm run qa:full\nnpm audit --audit-level=moderate\n\`\`\`\n\nVisual QA builds and serves the static site, checks desktop and mobile layouts, fails on console/page errors, horizontal overflow, missing hero/nav/CTA visibility, broken hash anchors, and visible nav ellipses, then writes screenshots to \`.agent/audits/screenshots/\`. If Chromium is not installed yet, run \`npx playwright install chromium\` once.\n\n## Deploy verification\n\`\`\`bash\nLIVE_URL=\"{{LIVE_URL}}\" \\\nEXPECT_TEXT=\"{{EXPECT_TEXT}}\" \\\nREPO=\"{{OWNER_REPO}}\" \\\nnpm run verify:deploy\n\`\`\`\n\n## Agent maintenance notes\n- Read \`AGENTS.md\` before editing.\n- Keep visible copy aligned with \`.agent/site.contract.yaml\` and \`.agent/brand.contract.yaml\`.\n- Payment mode is disabled in \`.agent/payment.contract.yaml\`; do not add payment links without explicit approval.\n- Deployment is GitHub Pages via \`.github/workflows/deploy.yml\`.\n`,
  'AGENTS.md': `# AGENTS.md\n\n## Mission\n{{PROJECT_NAME}} is a static AgentSite generated from this requester brief: {{BRIEF}}\n\n## Audience\n{{AUDIENCE_LIST_MD}}\n\n## Stack\n- Astro static site\n- Astro production build checks\n- GitHub Pages via GitHub Actions\n- Lightweight repo-local scripts in \`scripts/\`\n\n## Recipe registry\nSelected recipes: {{RECIPE_SELECTION_INLINE}}\nArchetype: {{ARCHETYPE}}\nVisual preset: {{VISUAL_PRESET}}\nauto_recipe_selection: {{AUTO_RECIPE_SELECTION}}\n\nUse \`npm run list:recipes\`, \`npm run score:recipes\`, and \`npm run recommend:recipes\` before applying or changing registered patterns. Recipe guidance is static-safe composition guidance, not permission to add live data, analytics, payments, or unsupported claims.\n\n## Safe edit boundaries\nAgents may safely edit:\n- \`src/components/**\`, \`src/pages/**\`, \`src/styles/**\`, \`src/data/**\`\n- Copy that remains consistent with \`.agent/site.contract.yaml\` and \`.agent/brand.contract.yaml\`\n- Supported claims listed in \`.agent/site.contract.yaml\`\n- Documentation, runbooks, and plan files that reflect actual behavior\n\n## Approval-required changes\nGet explicit human approval before:\n{{APPROVAL_LIST_MD}}\n\n## QA commands\nRun before handoff:\n\`\`\`bash\nnpm run qa\n\`\`\`\n\nIndividual gates:\n\`\`\`bash\nnpm run check:contract\nnpm run check:claims\nnpm run check:seo\nnpm run check:links\nnpm run check:artifacts\nnpm run check:roadmap\nnpm run build:search-index\nnpm run check:search-index\nnpm run check:atlas\nnpm run check:runs\nnpm run check:requests\nnpm run build:briefing\nnpm run check:briefing\nnpm run build\n\`\`\`\n\n## Feature-request process\n1. Capture the natural-language request as a short brief.\n2. Compare it with \`.agent/site.contract.yaml\`, \`.agent/brand.contract.yaml\`, and \`.agent/payment.contract.yaml\`.\n3. Record assumptions and acceptance criteria in an issue or plan file.\n4. Implement the smallest coherent change.\n5. Run QA and include command output summary in the handoff.\n6. Deploy only after checks pass.\n7. Verify the live URL contains expected current copy.\n`,
  '.agent/site.contract.yaml': `name: {{PROJECT_NAME}} site contract\nversion: 0.1.0\nowner_role: AgentSite maintenance agent\nsite:\n  type: static_landing_page\n  framework: Astro\n  deploy_target: GitHub Pages\n  repository_visibility: public_allowed\nmission: >\n  {{DESCRIPTION}}\nbrief: >\n  {{BRIEF}}\naudience:\n{{AUDIENCE_YAML}}\nrequired_sections:\n{{REQUIRED_SECTIONS_YAML}}\nrecipe_registry:\n  selected_recipes:\n{{RECIPE_SELECTION_YAML}}\n  archetype: {{ARCHETYPE_YAML}}\n  visual_preset: {{VISUAL_PRESET_YAML}}\n  auto_recipe_selection: {{AUTO_RECIPE_SELECTION_YAML}}\n  note: Recipes are static-safe composition guidance and do not approve live data, analytics, payments, or unsupported claims.\ncontent_rules:\n  must_include:\n    - static GitHub Pages delivery\n    - repo-local QA\n    - no-payment mode\n  allowed_claims:\n{{ALLOWED_CLAIMS_YAML}}\n  must_not_include:\n{{FORBIDDEN_CLAIMS_YAML}}\napproval_required:\n{{APPROVAL_REQUIRED_YAML}}\nqa:\n  commands:\n    - npm run qa\n    - npm run build\nverification:\n  live_url: {{LIVE_URL}}\n  expected_text: {{EXPECT_TEXT}}\n`,
  '.agent/brand.contract.yaml': `name: {{PROJECT_NAME}} brand contract\nversion: 0.1.0\nvoice:\n  tone:\n    - crisp\n    - trustworthy\n    - clear\n    - direct\n  avoid:\n    - generic SaaS slop\n    - exaggerated AI magic\n    - fake urgency\n    - fake social proof\nvisual_system:\n  direction: {{VISUAL_DIRECTION}}\n  colors:\n    background: '#070b16'\n    text: '#edf2ff'\n    accent: '#85f3d7'\n    accent_secondary: '#9fb7ff'\n  typography:\n    sans: Inter\n    mono: JetBrains Mono\naccessibility:\n  responsive: true\n  semantic_sections: true\n  minimum_contrast: high on dark background\n`,
  '.agent/payment.contract.yaml': `name: {{PROJECT_NAME}} payment contract\nversion: 0.1.0\nmode: disabled\nstatus: no-payment\nrules:\n  - Do not add live payment links.\n  - Do not collect card details or billing information.\n  - Do not imply paid availability.\n  - Any payment integration requires explicit human approval and a new contract review.\nallowed_copy:\n  - payment disabled\n  - no-payment mode\nblocked_domains:\n  - stripe.com\n  - paypal.com\n  - paddle.com\n  - lemonsqueezy.com\n`,
  '.agent/runbooks/deploy.md': `# Deployment runbook\n\n## Target\nGitHub Pages serves the static Astro build from the GitHub Actions artifact.\n\n## Normal deployment\n1. Confirm contracts and QA pass: \`npm run qa\`.\n2. Commit changes to \`main\`.\n3. Push to GitHub.\n4. GitHub Actions runs \`.github/workflows/deploy.yml\`.\n5. Verify the live URL contains expected text: \`{{EXPECT_TEXT}}\`.\n\n## Manual verification\n\`\`\`bash\nLIVE_URL=\"{{LIVE_URL}}\" EXPECT_TEXT=\"{{EXPECT_TEXT}}\" REPO=\"{{OWNER_REPO}}\" npm run verify:deploy\n\`\`\`\n\n## Rollback\nRevert the problematic commit, run QA, and push \`main\` again. Do not rewrite public history unless explicitly approved.\n`,
  '.agent/runbooks/feature-request.md': `# Feature request runbook\n\n1. Capture the requester language verbatim.\n2. Translate it into audience, sections, claims allowed, claims disallowed, deployment constraints, and maintenance constraints.\n3. Check against \`.agent/site.contract.yaml\`, \`.agent/brand.contract.yaml\`, and \`.agent/payment.contract.yaml\`.\n4. If the request touches approval-required areas from \`AGENTS.md\`, stop and request approval.\n5. Add or update a plan in \`.hermes/plans/\` for non-trivial work.\n6. Implement in small commits when practical.\n7. Run \`npm run qa\` and capture the result in the handoff.\n8. Verify GitHub Pages after deployment.\n`,
  '.agent/templates/initial-plan.template.md': `# Initial site build plan: [PROJECT_NAME]\n\n## Request\n[Paste or summarize the natural-language request.]\n\n## Assumptions\n- The site remains static and deploys to GitHub Pages unless approved otherwise.\n- No analytics, payments, fake customers, fake metrics, or unsupported claims will be added.\n\n## Scope\n- [What will be built.]\n\n## Acceptance criteria\n- Contracts exist and match visible copy.\n- QA scripts pass locally.\n- GitHub Pages deploy succeeds.\n`,
  '.hermes/plans/initial-site-build.md': `# Initial site build plan: {{PROJECT_NAME}}\n\n## Request\n{{BRIEF}}\n\n## Audience\n{{AUDIENCE_LIST_MD}}\n\n## Site sections\n{{SECTIONS_SUMMARY_MD}}\n\n## Proof/artifacts\n{{PROOF_SUMMARY_MD}}\n\n## Assumptions\n- The site remains static and deploys to GitHub Pages.\n- No analytics, payments, fake customers, fake metrics, or unsupported claims are included.\n\n## Scope\n- Generate a safe first-pass landing page and repo guardrails.\n\n## Non-goals\n- Payment, analytics, custom domains, server runtime, and unsupported claims.\n\n## Files expected to change\n- \`AGENTS.md\`\n- \`.agent/**\`\n- \`.github/workflows/deploy.yml\`\n- \`package.json\`\n- \`scripts/**\`\n- \`src/**\`\n\n## Acceptance criteria\n- Hero and core sections reflect the brief.\n- Contracts exist and payment remains disabled/no-payment.\n- \`npm run qa\` passes locally.\n- GitHub Pages deploy succeeds and live URL contains \`{{EXPECT_TEXT}}\`.\n\n## QA commands\n\`\`\`bash\nnpm run qa\nnpm audit --audit-level=moderate\n\`\`\`\n\n## Deploy/verify\n\`\`\`bash\nLIVE_URL=\"{{LIVE_URL}}\" EXPECT_TEXT=\"{{EXPECT_TEXT}}\" REPO=\"{{OWNER_REPO}}\" npm run verify:deploy\n\`\`\`\n`,
  '.github/workflows/deploy.yml': `name: Deploy to GitHub Pages\n\non:\n  push:\n    branches: [main]\n  workflow_dispatch:\n\npermissions:\n  contents: read\n  pages: write\n  id-token: write\n\nconcurrency:\n  group: pages\n  cancel-in-progress: false\n\nenv:\n  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true\n\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - name: Checkout\n        uses: actions/checkout@v4\n      - name: Setup Node\n        uses: actions/setup-node@v4\n        with:\n          node-version: 22\n          cache: npm\n      - name: Install dependencies\n        run: npm ci\n      - name: Run QA\n        run: npm run qa\n      - name: Upload artifact\n        uses: actions/upload-pages-artifact@v3\n        with:\n          path: ./dist\n\n  deploy:\n    needs: build\n    runs-on: ubuntu-latest\n    environment:\n      name: github-pages\n      url: $\{{ steps.deployment.outputs.page_url }}\n    steps:\n      - name: Deploy to GitHub Pages\n        id: deployment\n        uses: actions/deploy-pages@v4\n`,
  'src/env.d.ts': `/// <reference types=\"astro/client\" />\n`,
  'src/layouts/BaseLayout.astro': `---\nconst { title = '{{PROJECT_NAME}}', description = '{{DESCRIPTION}}' } = Astro.props;\n---\n<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"utf-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n    <meta name=\"generator\" content={Astro.generator} />\n    <meta name=\"description\" content={description} />\n    <meta property=\"og:title\" content={title} />\n    <meta property=\"og:description\" content={description} />\n    <meta property=\"og:type\" content=\"website\" />\n    <meta name=\"theme-color\" content=\"#0b1020\" />\n    <title>{title}</title>\n    <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\" />\n    <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin />\n    <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap\" rel=\"stylesheet\" />\n  </head>\n  <body>\n    <slot />\n  </body>\n</html>\n`,
  'src/pages/index.astro': '{{SITE_INDEX}}',
  'src/styles/global.css': '{{GLOBAL_CSS}}',
  'scripts/check-contracts.mjs': `import fs from 'node:fs';\n\nconst required = [\n  'AGENTS.md',\n  '.agent/site.contract.yaml',\n  '.agent/brand.contract.yaml',\n  '.agent/payment.contract.yaml',\n  '.agent/runbooks/deploy.md',\n  '.agent/runbooks/feature-request.md',\n  '.agent/recipes/README.md',\n  '.agent/recipes/product-cockpit/recipe.yaml',\n  '.agent/recipes/product-cockpit/README.md',\n  '.agent/recipes/product-cockpit/acceptance.md',\n  '.agent/recipes/copy-evidence-strip/recipe.yaml',\n  '.agent/recipes/copy-evidence-strip/README.md',\n  '.agent/recipes/copy-evidence-strip/acceptance.md',\n  '.agent/recipes/editorial-ledger/recipe.yaml',\n  '.agent/recipes/editorial-ledger/README.md',\n  '.agent/recipes/editorial-ledger/acceptance.md',\n  '.agent/recipes/artifact-gallery/recipe.yaml',\n  '.agent/recipes/artifact-gallery/README.md',\n  '.agent/recipes/artifact-gallery/acceptance.md',\n  '.agent/recipes/roadmap-board/recipe.yaml',\n  '.agent/recipes/roadmap-board/README.md',\n  '.agent/recipes/roadmap-board/acceptance.md',\n  '.agent/recipes/search-index/recipe.yaml',\n  '.agent/recipes/search-index/README.md',\n  '.agent/recipes/search-index/acceptance.md',\n  '.agent/recipes/agentsite-atlas/recipe.yaml',\n  '.agent/recipes/agentsite-atlas/README.md',\n  '.agent/recipes/agentsite-atlas/acceptance.md',\n  '.agent/recipes/agent-run-ledger/recipe.yaml',\n  '.agent/recipes/agent-run-ledger/README.md',\n  '.agent/recipes/agent-run-ledger/acceptance.md',\n  '.agent/recipes/feature-request-inbox/recipe.yaml',\n  '.agent/recipes/feature-request-inbox/README.md',\n  '.agent/recipes/feature-request-inbox/acceptance.md',\n  '.agent/recipes/chief-of-staff-briefing/recipe.yaml',\n  '.agent/recipes/chief-of-staff-briefing/README.md',\n  '.agent/recipes/chief-of-staff-briefing/acceptance.md',\n  '.hermes/plans/initial-site-build.md'\n];\n\nconst missing = required.filter((file) => !fs.existsSync(file));\nif (missing.length) {\n  console.error(\`Missing required contract files:\\n\${missing.join('\\n')}\`);\n  process.exit(1);\n}\n\nconst payment = fs.readFileSync('.agent/payment.contract.yaml', 'utf8');\nif (!/mode:\\s*disabled/.test(payment) || !/no-payment/.test(payment)) {\n  console.error('Payment contract must stay in disabled/no-payment mode.');\n  process.exit(1);\n}\n\nconsole.log(\`contract check passed (\${required.length} files, payment disabled)\`);\n`,
  'scripts/check-claims.mjs': `import fs from 'node:fs';\nimport path from 'node:path';\n\nconst roots = ['src', 'README.md'];\nconst blocked = [\n  /trusted by\\s+\\d+/i,\n  /\\d+[kmb]?\\+\\s+(customers|users|teams|developers)/i,\n  /guaranteed\\s+(results|uptime|revenue|conversion)/i,\n  /testimonial/i,\n  /case study/i,\n  /stripe\\.com|paypal\\.com|paddle\\.com|lemonsqueezy\\.com/i\n];\n\nfunction walk(target) {\n  const stat = fs.statSync(target);\n  if (stat.isFile()) return [target];\n  return fs.readdirSync(target).flatMap((entry) => walk(path.join(target, entry)));\n}\n\nconst files = roots.flatMap((root) => fs.existsSync(root) ? walk(root) : []).filter((file) => /\\.(astro|css|md|js|mjs|ts)$/.test(file));\nconst failures = [];\nfor (const file of files) {\n  const text = fs.readFileSync(file, 'utf8');\n  for (const pattern of blocked) {\n    if (pattern.test(text)) failures.push(\`\${file}: blocked claim/link matched \${pattern}\`);\n  }\n}\n\nif (failures.length) {\n  console.error(failures.join('\\n'));\n  process.exit(1);\n}\nconsole.log(\`claims check passed (\${files.length} files scanned)\`);\n`,
  'scripts/check-seo.mjs': `import fs from 'node:fs';\n\nconst index = fs.readFileSync('src/pages/index.astro', 'utf8');\nconst layout = fs.readFileSync('src/layouts/BaseLayout.astro', 'utf8');\nconst contract = fs.readFileSync('.agent/site.contract.yaml', 'utf8');\nconst requiredText = ['{{PROJECT_NAME}}', 'GitHub Pages', 'repo-local QA', 'no-payment mode'];\nconst failures = [];\n\nif (!/<title>/.test(layout)) failures.push('missing <title> in layout');\nif (!/meta name=\"description\"/.test(layout)) failures.push('missing meta description');\nif (!/<h1>/.test(index)) failures.push('missing h1');\nfor (const text of requiredText) {\n  if (!index.includes(text) && !contract.includes(text)) failures.push(\`missing required phrase: \${text}\`);\n}\n\nif (failures.length) {\n  console.error(failures.join('\\n'));\n  process.exit(1);\n}\nconsole.log('seo/content check passed');\n`,
  'scripts/check-links.mjs': `import fs from 'node:fs';\nimport path from 'node:path';\n\nfunction walk(target) {\n  const stat = fs.statSync(target);\n  if (stat.isFile()) return [target];\n  return fs.readdirSync(target).flatMap((entry) => walk(path.join(target, entry)));\n}\n\nconst files = walk('src').filter((file) => /\\.astro$/.test(file));\nconst all = files.map((file) => fs.readFileSync(file, 'utf8')).join('\\n');\nconst ids = new Set([...all.matchAll(/id=\"([^\"]+)\"/g)].map((match) => match[1]));\nconst hrefs = [...all.matchAll(/href=\"([^\"]+)\"/g)].map((match) => match[1]);\nconst failures = [];\n\nfor (const href of hrefs) {\n  if (href.startsWith('#') && !ids.has(href.slice(1))) failures.push(\`broken anchor: \${href}\`);\n  if (/stripe\\.com|paypal\\.com|paddle\\.com|lemonsqueezy\\.com/i.test(href)) failures.push(\`payment link not allowed: \${href}\`);\n  if (/google-analytics|googletagmanager|segment\\.com/i.test(href)) failures.push(\`tracking link not allowed: \${href}\`);\n}\n\nif (failures.length) {\n  console.error(failures.join('\\n'));\n  process.exit(1);\n}\nconsole.log(\`link check passed (\${hrefs.length} hrefs, \${ids.size} anchors)\`);\n`,
  'scripts/check-artifacts.mjs': fs.readFileSync(path.join(scriptDir, 'check-artifacts.mjs'), 'utf8'),
  'scripts/check-roadmap.mjs': fs.readFileSync(path.join(scriptDir, 'check-roadmap.mjs'), 'utf8'),
  'scripts/build-search-index.mjs': fs.readFileSync(path.join(scriptDir, 'build-search-index.mjs'), 'utf8'),
  'scripts/check-search-index.mjs': fs.readFileSync(path.join(scriptDir, 'check-search-index.mjs'), 'utf8'),
  'scripts/check-atlas.mjs': fs.readFileSync(path.join(scriptDir, 'check-atlas.mjs'), 'utf8'),
  'scripts/check-runs.mjs': fs.readFileSync(path.join(scriptDir, 'check-runs.mjs'), 'utf8'),
  'scripts/check-requests.mjs': fs.readFileSync(path.join(scriptDir, 'check-requests.mjs'), 'utf8'),
  'scripts/build-briefing.mjs': fs.readFileSync(path.join(scriptDir, 'build-briefing.mjs'), 'utf8'),
  'scripts/check-briefing.mjs': fs.readFileSync(path.join(scriptDir, 'check-briefing.mjs'), 'utf8'),
  'src/data/artifacts.json': JSON.stringify(buildArtifactsData(), null, 2) + '\n',
  'src/data/roadmap.json': JSON.stringify(buildRoadmapData(), null, 2) + '\n',
  'src/data/search-index.json': JSON.stringify(buildInitialSearchIndexData(), null, 2) + '\n',
  'src/data/atlas.json': JSON.stringify(buildAtlasData(), null, 2) + '\n',
  'src/data/runs.json': JSON.stringify(buildRunLedgerData(), null, 2) + '\n',
  'src/data/requests.json': JSON.stringify(buildRequestInboxData(), null, 2) + '\n',
  'src/data/briefing.json': JSON.stringify(buildInitialBriefingData(), null, 2) + '\n',
  'src/components/ArtifactGallery.astro': fs.readFileSync(path.join(scriptDir, '..', 'src', 'components', 'ArtifactGallery.astro'), 'utf8'),
  'src/components/RoadmapBoard.astro': fs.readFileSync(path.join(scriptDir, '..', 'src', 'components', 'RoadmapBoard.astro'), 'utf8'),
  'src/components/SearchIndex.astro': fs.readFileSync(path.join(scriptDir, '..', 'src', 'components', 'SearchIndex.astro'), 'utf8'),
  'src/components/AgentSiteAtlas.astro': fs.readFileSync(path.join(scriptDir, '..', 'src', 'components', 'AgentSiteAtlas.astro'), 'utf8'),
  'src/components/AgentRunLedger.astro': fs.readFileSync(path.join(scriptDir, '..', 'src', 'components', 'AgentRunLedger.astro'), 'utf8'),
  'src/components/FeatureRequestInbox.astro': fs.readFileSync(path.join(scriptDir, '..', 'src', 'components', 'FeatureRequestInbox.astro'), 'utf8'),
  'src/components/ChiefOfStaffBriefing.astro': fs.readFileSync(path.join(scriptDir, '..', 'src', 'components', 'ChiefOfStaffBriefing.astro'), 'utf8'),
  'scripts/list-recipes.mjs': fs.readFileSync(path.join(scriptDir, 'list-recipes.mjs'), 'utf8'),
  'scripts/score-recipes.mjs': fs.readFileSync(path.join(scriptDir, 'score-recipes.mjs'), 'utf8'),
  'scripts/recipe-selector.mjs': fs.readFileSync(path.join(scriptDir, 'recipe-selector.mjs'), 'utf8'),
  'scripts/recommend-recipes.mjs': fs.readFileSync(path.join(scriptDir, 'recommend-recipes.mjs'), 'utf8'),
  '.agent/recipes/README.md': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'README.md'), 'utf8'),
  '.agent/recipes/product-cockpit/recipe.yaml': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'product-cockpit', 'recipe.yaml'), 'utf8'),
  '.agent/recipes/product-cockpit/README.md': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'product-cockpit', 'README.md'), 'utf8'),
  '.agent/recipes/product-cockpit/acceptance.md': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'product-cockpit', 'acceptance.md'), 'utf8'),
  '.agent/recipes/copy-evidence-strip/recipe.yaml': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'copy-evidence-strip', 'recipe.yaml'), 'utf8'),
  '.agent/recipes/copy-evidence-strip/README.md': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'copy-evidence-strip', 'README.md'), 'utf8'),
  '.agent/recipes/copy-evidence-strip/acceptance.md': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'copy-evidence-strip', 'acceptance.md'), 'utf8'),
  '.agent/recipes/editorial-ledger/recipe.yaml': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'editorial-ledger', 'recipe.yaml'), 'utf8'),
  '.agent/recipes/editorial-ledger/README.md': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'editorial-ledger', 'README.md'), 'utf8'),
  '.agent/recipes/editorial-ledger/acceptance.md': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'editorial-ledger', 'acceptance.md'), 'utf8'),
  '.agent/recipes/artifact-gallery/recipe.yaml': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'artifact-gallery', 'recipe.yaml'), 'utf8'),
  '.agent/recipes/artifact-gallery/README.md': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'artifact-gallery', 'README.md'), 'utf8'),
  '.agent/recipes/artifact-gallery/acceptance.md': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'artifact-gallery', 'acceptance.md'), 'utf8'),
  '.agent/recipes/roadmap-board/recipe.yaml': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'roadmap-board', 'recipe.yaml'), 'utf8'),
  '.agent/recipes/roadmap-board/README.md': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'roadmap-board', 'README.md'), 'utf8'),
  '.agent/recipes/roadmap-board/acceptance.md': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'roadmap-board', 'acceptance.md'), 'utf8'),
  '.agent/recipes/search-index/recipe.yaml': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'search-index', 'recipe.yaml'), 'utf8'),
  '.agent/recipes/search-index/README.md': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'search-index', 'README.md'), 'utf8'),
  '.agent/recipes/search-index/acceptance.md': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'search-index', 'acceptance.md'), 'utf8'),
  '.agent/recipes/agentsite-atlas/recipe.yaml': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'agentsite-atlas', 'recipe.yaml'), 'utf8'),
  '.agent/recipes/agentsite-atlas/README.md': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'agentsite-atlas', 'README.md'), 'utf8'),
  '.agent/recipes/agentsite-atlas/acceptance.md': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'agentsite-atlas', 'acceptance.md'), 'utf8'),
  '.agent/recipes/agent-run-ledger/recipe.yaml': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'agent-run-ledger', 'recipe.yaml'), 'utf8'),
  '.agent/recipes/agent-run-ledger/README.md': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'agent-run-ledger', 'README.md'), 'utf8'),
  '.agent/recipes/agent-run-ledger/acceptance.md': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'agent-run-ledger', 'acceptance.md'), 'utf8'),
  '.agent/recipes/feature-request-inbox/recipe.yaml': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'feature-request-inbox', 'recipe.yaml'), 'utf8'),
  '.agent/recipes/feature-request-inbox/README.md': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'feature-request-inbox', 'README.md'), 'utf8'),
  '.agent/recipes/feature-request-inbox/acceptance.md': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'feature-request-inbox', 'acceptance.md'), 'utf8'),
  '.agent/recipes/chief-of-staff-briefing/recipe.yaml': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'chief-of-staff-briefing', 'recipe.yaml'), 'utf8'),
  '.agent/recipes/chief-of-staff-briefing/README.md': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'chief-of-staff-briefing', 'README.md'), 'utf8'),
  '.agent/recipes/chief-of-staff-briefing/acceptance.md': fs.readFileSync(path.join(scriptDir, '..', '.agent', 'recipes', 'chief-of-staff-briefing', 'acceptance.md'), 'utf8'),
  'scripts/check-visual-divergence.mjs': fs.readFileSync(path.join(scriptDir, 'check-visual-divergence.mjs'), 'utf8'),
  'scripts/visual-qa.mjs': fs.readFileSync(path.join(scriptDir, 'visual-qa.mjs'), 'utf8'),
  'scripts/verify-deploy.mjs': `import { execFileSync } from 'node:child_process';\n\nconst liveUrl = process.env.LIVE_URL;\nconst expected = process.env.EXPECT_TEXT;\nconst repo = process.env.REPO;\n\nif (!liveUrl || !expected) {\n  console.error('Set LIVE_URL and EXPECT_TEXT before running verify:deploy. Optional: REPO=owner/name');\n  process.exit(1);\n}\n\ntry {\n  const html = execFileSync('curl', ['-LfsS', liveUrl], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });\n  if (!html.includes(expected)) {\n    console.error(\`Live URL did not contain expected text: \${expected}\`);\n    process.exit(1);\n  }\n  console.log(\`live content check passed: \${liveUrl}\`);\n} catch (error) {\n  console.error(\`live content check failed: \${error.message}\`);\n  process.exit(1);\n}\n\nif (repo) {\n  try {\n    const out = execFileSync('gh', ['run', 'list', '--repo', repo, '--workflow', 'deploy.yml', '--limit', '1'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });\n    console.log(out.trim() || 'No deploy runs returned by gh.');\n  } catch {\n    console.log('GitHub Actions check skipped: gh unavailable, unauthenticated, or repo inaccessible.');\n  }\n}\n`
}));

for (const [relative, template] of files) write(relative, render(template, view));

console.log(`Created AgentSite scaffold at ${outDir}`);
console.log(`Name: ${projectName}`);
console.log(`Repo: ${view.OWNER_REPO}`);
console.log(`Expected live URL: ${liveUrl}`);
console.log('\nNext local commands:');
console.log(`  cd ${shellQuote(outDir)}`);
console.log('  npm install');
console.log('  npm run qa');
console.log('\nPublish is OFF by default. No GitHub repo was created.');

if (publish) publishProject();
else {
  console.log('\nTo publish later:');
  const configBit = rawArgs.config ? ` --config ${shellQuote(path.resolve(String(rawArgs.config)))}` : ` --name ${shellQuote(projectName)} --repo ${shellQuote(repoName)} --brief ${shellQuote(brief)} --owner ${shellQuote(owner)}`;
  console.log(`  npm run create:agentsite --${configBit} --out ${shellQuote(outDir)} --publish --force`);
}

function buildIndexAstro() {
  const navLinks = sections.slice(0, 3).map((section) => `<a href="#${attr(section.id)}">${escapeHtml(section.navLabel)}</a>`).join('');
  const audienceItems = audience.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n');
  const sectionHtml = sections.map((section, index) => `\n    <section class="section content-section" id="${attr(section.id)}">\n      <div class="section-kicker">${String(index + 1).padStart(2, '0')} · ${escapeHtml(section.id.replaceAll('-', ' '))}</div>\n      <h2>${escapeHtml(section.title)}</h2>\n      <p>${escapeHtml(section.body)}</p>\n    </section>`).join('\n');
  const proofHtml = proofArtifacts.map((item) => `<article><h3>${escapeHtml(item.label)}</h3><p>${escapeHtml(item.body)}</p></article>`).join('\n');
  const claimHtml = allowedClaims.slice(0, 4).map((claim) => `<p><span>${escapeHtml(claim.split(/\s+/).slice(0, 2).join(' '))}</span> ${escapeHtml(claim)}</p>`).join('\n');
  const evidenceStrip = usesCopyEvidenceStrip ? buildCopyEvidenceStripMarkup('default') : '';
  return `---\nimport BaseLayout from '../layouts/BaseLayout.astro';\nimport '../styles/global.css';\n${usesArtifactGallery ? "import ArtifactGallery from '../components/ArtifactGallery.astro';\n" : ''}${usesRoadmapBoard ? "import RoadmapBoard from '../components/RoadmapBoard.astro';\n" : ''}${usesSearchIndex ? "import SearchIndex from '../components/SearchIndex.astro';\n" : ''}${usesAgentSiteAtlas ? "import AgentSiteAtlas from '../components/AgentSiteAtlas.astro';\n" : ''}${usesAgentRunLedger ? "import AgentRunLedger from '../components/AgentRunLedger.astro';\n" : ''}${usesFeatureRequestInbox ? "import FeatureRequestInbox from '../components/FeatureRequestInbox.astro';\n" : ''}${usesChiefOfStaffBriefing ? "import ChiefOfStaffBriefing from '../components/ChiefOfStaffBriefing.astro';\n" : ''}---\n<BaseLayout title="${attr(projectName)}" description="${attr(description)}">\n  <main>\n    <section class="hero" id="top">\n      <nav class="nav" aria-label="Primary navigation">\n        <a class="brand" href="#top" aria-label="${attr(projectName)} home"><span class="brand-mark">${escapeHtml(projectName.slice(0, 1).toUpperCase())}</span><span>${escapeHtml(projectName)}</span></a>\n        <div class="nav-links">${navLinks}<a href="#proof">Proof</a></div>\n      </nav>\n      <div class="hero-grid">\n        <div class="hero-copy">\n          <p class="eyebrow">Static AgentSite · GitHub Pages · no-payment mode</p>\n          <h1>${escapeHtml(heroHeadline.replace(/\.$/, ''))}</h1>\n          <p class="hero-lede">${escapeHtml(heroLede)}</p>\n          <div class="hero-actions"><a class="button primary" href="${attr(primaryCtaHref)}">${escapeHtml(primaryCtaLabel)}</a><a class="button secondary" href="${attr(repoUrl)}">View source</a></div>\n        </div>\n        <aside class="terminal-card" aria-label="Project summary"><div class="terminal-top"><span></span><span></span><span></span><strong>agentsite/status</strong></div><div class="terminal-body">${claimHtml}</div></aside>\n      </div>\n    </section>${evidenceStrip}${usesArtifactGallery ? buildArtifactGalleryMarkup() : ''}${usesRoadmapBoard ? buildRoadmapBoardMarkup() : ''}${usesSearchIndex ? buildSearchIndexMarkup() : ''}${usesChiefOfStaffBriefing ? buildChiefOfStaffBriefingMarkup() : ''}${usesFeatureRequestInbox ? buildFeatureRequestInboxMarkup() : ''}${usesAgentRunLedger ? buildAgentRunLedgerMarkup() : ''}${usesAgentSiteAtlas ? buildAgentSiteAtlasMarkup() : ''}\n\n    <section class="section audience" id="brief"><div class="section-kicker">Audience</div><h2>Built for the people named in the brief</h2><ul>${audienceItems}</ul></section>${sectionHtml}\n\n    <section class="section cards" id="proof"><div class="section-kicker">Proof artifacts</div><h2>Evidence this site can safely maintain</h2><div class="card-grid">${proofHtml}</div></section>\n\n    <section class="section cta" id="cta"><div><div class="section-kicker">Next step</div><h2>${escapeHtml(primaryCtaLabel)}</h2><p>Use the repository contracts and QA commands before changing claims, scope, payments, analytics, or deployment settings.</p></div><a class="button primary" href="${attr(primaryCtaHref)}">${escapeHtml(primaryCtaLabel)}</a></section>\n  </main>\n</BaseLayout>\n`;
}

function buildGlobalCss() {
  return `:root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #070b16; color: #edf2ff; }\n* { box-sizing: border-box; }\nbody { margin: 0; min-height: 100vh; background: radial-gradient(circle at 12% 4%, rgba(133, 243, 215, .18), transparent 28rem), radial-gradient(circle at 85% 12%, rgba(159, 183, 255, .14), transparent 30rem), #070b16; }\na { color: inherit; }\n.hero, .section { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }\n.hero { padding: 28px 0 80px; }\n.nav { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 72px; }\n.brand, .nav-links { display: flex; align-items: center; gap: 12px; text-decoration: none; }\n.brand-mark { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; background: #85f3d7; color: #071016; font-weight: 800; }\n.nav-links { flex-wrap: wrap; justify-content: flex-end; }\n.nav-links a { opacity: .76; text-decoration: none; font-size: .94rem; }\n.hero-grid { display: grid; grid-template-columns: minmax(0, 1.14fr) minmax(280px, .86fr); gap: 32px; align-items: center; }\n.eyebrow, .section-kicker, .terminal-body span { color: #85f3d7; font-family: "JetBrains Mono", monospace; text-transform: uppercase; letter-spacing: .08em; font-size: .78rem; }\nh1 { font-size: clamp(2.45rem, 7vw, 5.4rem); line-height: .96; margin: 0 0 24px; letter-spacing: -.06em; }\nh2 { font-size: clamp(2rem, 4vw, 3.25rem); line-height: 1; margin: 10px 0 18px; letter-spacing: -.04em; }\nh3 { margin: 0 0 10px; color: #f7f9ff; }\np, li { color: #b8c3de; line-height: 1.7; font-size: 1.05rem; }\n.hero-lede { max-width: 720px; font-size: 1.18rem; }\n.hero-actions { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 30px; }\n.button { display: inline-flex; align-items: center; justify-content: center; min-height: 46px; padding: 0 18px; border-radius: 999px; text-decoration: none; font-weight: 700; }\n.button.primary { background: #85f3d7; color: #071016; }\n.button.secondary { border: 1px solid rgba(237,242,255,.18); background: rgba(255,255,255,.05); }\n.terminal-card, article, .audience, .cta, .content-section { border: 1px solid rgba(237,242,255,.12); background: linear-gradient(180deg, rgba(255,255,255,.07), rgba(255,255,255,.035)); box-shadow: 0 24px 80px rgba(0,0,0,.26); }\n.terminal-card { border-radius: 22px; overflow: hidden; }\n.terminal-top { display: flex; align-items: center; gap: 8px; padding: 14px 16px; border-bottom: 1px solid rgba(237,242,255,.1); }\n.terminal-top span { width: 10px; height: 10px; border-radius: 50%; background: #85f3d7; opacity: .7; }\n.terminal-top strong { margin-left: auto; color: #b8c3de; font: 600 .78rem "JetBrains Mono", monospace; }\n.terminal-body { padding: 18px; }\n.terminal-body p { margin: 0 0 12px; }\n.section { padding: 58px 0; }\n.content-section, .audience, .cta { border-radius: 28px; padding: clamp(24px, 5vw, 46px); margin-bottom: 24px; }\n.audience ul { display: grid; gap: 10px; padding-left: 22px; }\n.card-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; }\narticle { border-radius: 22px; padding: 22px; }\n.cta { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 80px; }\n.cta p { max-width: 680px; }\n@media (max-width: 820px) { .nav, .cta { align-items: flex-start; flex-direction: column; } .hero-grid, .card-grid { grid-template-columns: 1fr; } .hero { padding-bottom: 42px; } }\n`;
}

function buildAutoRecipeSelection() {
  const explicitSelection = explicitRecipeSelection || explicitVisualPreset || explicitArchetype;
  if (!autoRecipesRequested) {
    return {
      applied: false,
      selectedRecipes,
      visualPreset,
      archetype,
      reasons: [],
      summary: 'not requested; default recipe selection unchanged'
    };
  }
  if (explicitSelection) {
    return {
      applied: false,
      selectedRecipes,
      visualPreset,
      archetype,
      reasons: ['explicit recipes or visualPreset provided; auto selector did not override'],
      summary: 'not applied; explicit recipes, archetype, or visualPreset preserved'
    };
  }

  const recommendation = recommendRecipes({
    brief,
    description,
    audience,
    sections: args.sections === undefined ? [] : sections,
    proofArtifacts: args.proofArtifacts === undefined ? [] : proofArtifacts
  });

  if (!recommendation.selectedRecipes.length) {
    return {
      applied: false,
      selectedRecipes,
      visualPreset,
      archetype,
      reasons: recommendation.reasons,
      summary: recommendation.explanation
    };
  }

  return {
    applied: true,
    selectedRecipes: recommendation.selectedRecipes,
    visualPreset: recommendation.visualPreset,
    archetype: recommendation.archetype || '',
    reasons: recommendation.reasons,
    summary: recommendation.explanation
  };
}

function shouldRenderProductCockpit(recipeIds, preset, chosenArchetype = '') {
  const recipes = new Set(recipeIds.map((item) => item.toLowerCase()));
  const normalizedPreset = String(preset || '').trim().toLowerCase();
  const normalizedArchetype = String(chosenArchetype || '').trim().toLowerCase();
  return normalizedArchetype === 'product-cockpit' || recipes.has('product-cockpit') || ['cockpit-dark', 'product-cockpit'].includes(normalizedPreset);
}

function shouldRenderEditorialLedger(recipeIds, preset, chosenArchetype = '') {
  const recipes = new Set(recipeIds.map((item) => item.toLowerCase()));
  const normalizedPreset = String(preset || '').trim().toLowerCase();
  const normalizedArchetype = String(chosenArchetype || '').trim().toLowerCase();
  return normalizedArchetype === 'editorial-ledger' || recipes.has('editorial-ledger') || ['editorial-ledger', 'editorial-light', 'ledger-light'].includes(normalizedPreset);
}

function shouldRenderCopyEvidenceStrip(recipeIds, preset) {
  const recipes = new Set(recipeIds.map((item) => item.toLowerCase()));
  const normalizedPreset = String(preset || '').trim().toLowerCase();
  return recipes.has('copy-evidence-strip') || ['evidence-strip', 'copy-evidence-strip'].includes(normalizedPreset);
}

function shouldRenderArtifactGallery(recipeIds, preset) {
  const recipes = new Set(recipeIds.map((item) => item.toLowerCase()));
  const normalizedPreset = String(preset || '').trim().toLowerCase();
  return recipes.has('artifact-gallery') || ['artifact-gallery', 'artifact-browser'].includes(normalizedPreset);
}

function shouldRenderRoadmapBoard(recipeIds, preset) {
  const recipes = new Set(recipeIds.map((item) => item.toLowerCase()));
  const normalizedPreset = String(preset || '').trim().toLowerCase();
  return recipes.has('roadmap-board') || ['roadmap-board', 'roadmap'].includes(normalizedPreset);
}

function shouldRenderSearchIndex(recipeIds, preset) {
  const recipes = new Set(recipeIds.map((item) => item.toLowerCase()));
  const normalizedPreset = String(preset || '').trim().toLowerCase();
  return recipes.has('search-index') || ['search-index', 'site-search', 'static-intelligence'].includes(normalizedPreset);
}

function shouldRenderAgentSiteAtlas(recipeIds, preset) {
  const recipes = new Set(recipeIds.map((item) => item.toLowerCase()));
  const normalizedPreset = String(preset || '').trim().toLowerCase();
  return recipes.has('agentsite-atlas') || ['agentsite-atlas', 'atlas'].includes(normalizedPreset);
}

function shouldRenderAgentRunLedger(recipeIds, preset) {
  const recipes = new Set(recipeIds.map((item) => item.toLowerCase()));
  const normalizedPreset = String(preset || '').trim().toLowerCase();
  return recipes.has('agent-run-ledger') || ['agent-run-ledger', 'run-ledger', 'orchestration-ledger'].includes(normalizedPreset);
}

function shouldRenderFeatureRequestInbox(recipeIds, preset) {
  const recipes = new Set(recipeIds.map((item) => item.toLowerCase()));
  const normalizedPreset = String(preset || '').trim().toLowerCase();
  return recipes.has('feature-request-inbox') || ['feature-request-inbox', 'request-inbox', 'request-queue'].includes(normalizedPreset);
}

function shouldRenderChiefOfStaffBriefing(recipeIds, preset) {
  const recipes = new Set(recipeIds.map((item) => item.toLowerCase()));
  const normalizedPreset = String(preset || '').trim().toLowerCase();
  return recipes.has('chief-of-staff-briefing') || ['chief-of-staff-briefing', 'chief-briefing', 'executive-briefing'].includes(normalizedPreset);
}


function buildEditorialLedgerIndexAstro() {
  const navLinks = '<a href="#ledger">Ledger</a><a href="#sections">Sections</a><a href="#proof">Proof</a><a href="#limits">Limits</a>';
  const sectionList = sections.map((section, index) => `
        <article class="ledger-entry" id="${attr(section.id)}">
          <div class="entry-number">${String(index + 1).padStart(2, '0')}</div>
          <div>
            <p class="entry-label">${escapeHtml(section.navLabel)}</p>
            <h3>${escapeHtml(section.title)}</h3>
            <p>${escapeHtml(section.body)}</p>
          </div>
        </article>`).join('\n');
  const proofRows = proofArtifacts.map((item, index) => `
        <article class="proof-row">
          <span>${String(index + 1).padStart(2, '0')}</span>
          <h3>${escapeHtml(item.label)}</h3>
          <p>${escapeHtml(item.body)}</p>
        </article>`).join('\n');
  const claimRows = allowedClaims.slice(0, 5).map((claim, index) => {
    const artifact = proofArtifacts[index % proofArtifacts.length];
    return `
        <article class="claim-row">
          <span class="claim-index">${String(index + 1).padStart(2, '0')}</span>
          <strong>${escapeHtml(claim)}</strong>
          <p>${escapeHtml(artifact.label)} — ${escapeHtml(artifact.body)}</p>
        </article>`;
  }).join('\n');
  const boundaryItems = [
    ...forbiddenClaims.slice(0, 3).map((claim) => `<li>Not claimed: ${escapeHtml(safeVisibleClaim(claim))}</li>`),
    ...approvalRequired.slice(0, 3).map((item) => `<li>Approval required: ${escapeHtml(safeVisibleClaim(item))}</li>`)
  ].join('\n');
  const evidenceStrip = usesCopyEvidenceStrip ? buildCopyEvidenceStripMarkup('editorial') : '';
  return `---\nimport BaseLayout from '../layouts/BaseLayout.astro';\nimport '../styles/global.css';\n${usesArtifactGallery ? "import ArtifactGallery from '../components/ArtifactGallery.astro';\n" : ''}${usesRoadmapBoard ? "import RoadmapBoard from '../components/RoadmapBoard.astro';\n" : ''}${usesSearchIndex ? "import SearchIndex from '../components/SearchIndex.astro';\n" : ''}${usesAgentSiteAtlas ? "import AgentSiteAtlas from '../components/AgentSiteAtlas.astro';\n" : ''}${usesAgentRunLedger ? "import AgentRunLedger from '../components/AgentRunLedger.astro';\n" : ''}${usesFeatureRequestInbox ? "import FeatureRequestInbox from '../components/FeatureRequestInbox.astro';\n" : ''}${usesChiefOfStaffBriefing ? "import ChiefOfStaffBriefing from '../components/ChiefOfStaffBriefing.astro';\n" : ''}---\n<BaseLayout title="${attr(projectName)}" description="${attr(description)}">\n  <main class="editorial-ledger">\n    <section class="ledger-hero" id="top">\n      <nav class="ledger-nav" aria-label="Primary navigation">\n        <a class="ledger-brand" href="#top" aria-label="${attr(projectName)} home">${escapeHtml(projectName)}</a>\n        <div>${navLinks}</div>\n      </nav>\n      <div class="ledger-hero-grid">\n        <div>\n          <p class="ledger-kicker">Static AgentSite · editorial-ledger archetype · no-payment mode</p>\n          <h1>${escapeHtml(heroHeadline.replace(/\.$/, ''))}</h1>\n        </div>\n        <aside class="ledger-summary">\n          <p>${escapeHtml(heroLede)}</p>\n          <div class="ledger-actions"><a class="button primary" href="${attr(primaryCtaHref)}">${escapeHtml(primaryCtaLabel)}</a><a class="button secondary" href="${attr(repoUrl)}">View source</a></div>\n        </aside>\n      </div>\n    </section>\n\n    <section class="ledger-section opening-note">\n      <p class="ledger-kicker">Operating note</p>\n      <p>${escapeHtml(description)}</p>\n      <p>${escapeHtml(brief)}</p>\n    </section>${evidenceStrip}${usesArtifactGallery ? buildArtifactGalleryMarkup() : ''}${usesRoadmapBoard ? buildRoadmapBoardMarkup() : ''}${usesSearchIndex ? buildSearchIndexMarkup() : ''}${usesChiefOfStaffBriefing ? buildChiefOfStaffBriefingMarkup() : ''}${usesFeatureRequestInbox ? buildFeatureRequestInboxMarkup() : ''}${usesAgentRunLedger ? buildAgentRunLedgerMarkup() : ''}${usesAgentSiteAtlas ? buildAgentSiteAtlasMarkup() : ''}\n\n    <section class="ledger-section claim-ledger" id="ledger">\n      <div class="section-heading"><p class="ledger-kicker">Claim ledger</p><h2>Every major statement stays attached to evidence.</h2></div>\n      <div class="claim-list">${claimRows}\n      </div>\n    </section>\n\n    <section class="ledger-section entry-list" id="sections">\n      <div class="section-heading"><p class="ledger-kicker">Sections</p><h2>The page reads like a concise operating memo.</h2></div>${sectionList}\n    </section>\n\n    <section class="ledger-section proof-ledger" id="proof">\n      <div class="section-heading"><p class="ledger-kicker">Proof artifacts</p><h2>Evidence future agents can inspect before strengthening copy.</h2></div>\n      <div>${proofRows}\n      </div>\n    </section>\n\n    <section class="ledger-section limits" id="limits">\n      <div><p class="ledger-kicker">Boundaries</p><h2>Trust comes from saying what is not included.</h2></div>\n      <ul>${boundaryItems}</ul>\n    </section>\n\n    <section class="ledger-section cta" id="cta">\n      <div><p class="ledger-kicker">Next step</p><h2>${escapeHtml(primaryCtaLabel)}</h2><p>Use the ledger, contracts, and QA commands before changing claims, scope, payments, analytics, or deployment settings.</p></div>\n      <a class="button primary" href="${attr(primaryCtaHref)}">${escapeHtml(primaryCtaLabel)}</a>\n    </section>\n  </main>\n</BaseLayout>\n`;
}

function buildEditorialLedgerGlobalCss() {
  return `:root { color-scheme: light; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f5efe2; color: #211b16; }\n* { box-sizing: border-box; }\nhtml { scroll-behavior: smooth; overflow-x: hidden; }\nbody { margin: 0; min-height: 100vh; overflow-x: hidden; background: linear-gradient(90deg, rgba(61,43,31,.055) 1px, transparent 1px) 0 0 / 48px 48px, radial-gradient(circle at 78% 0%, rgba(154,84,49,.16), transparent 32rem), #f5efe2; }\na { color: inherit; }\n.editorial-ledger { width: min(1180px, calc(100% - 36px)); margin: 0 auto; }\n.ledger-hero { padding: 30px 0 70px; }\n.ledger-nav { display: flex; justify-content: space-between; gap: 20px; align-items: center; padding: 14px 0 86px; border-bottom: 1px solid rgba(33,27,22,.12); margin-bottom: 54px; }\n.ledger-nav div { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 16px; }\n.ledger-nav a { text-decoration: none; color: #5f5249; font-weight: 700; }\n.ledger-brand { color: #211b16 !important; font-weight: 900; letter-spacing: -.03em; }\n.ledger-hero-grid { display: grid; grid-template-columns: minmax(0, 1.25fr) minmax(300px, .75fr); gap: 46px; align-items: end; }\n.ledger-kicker, .entry-label, .claim-index, .proof-row span { color: #9a5431; font: 800 .74rem Inter, sans-serif; text-transform: uppercase; letter-spacing: .13em; }\nh1 { font-family: Georgia, "Times New Roman", serif; font-size: clamp(3.4rem, 9vw, 8.1rem); line-height: .88; letter-spacing: -.075em; margin: 0; max-width: 900px; }\nh2 { font-family: Georgia, "Times New Roman", serif; font-size: clamp(2.15rem, 4.2vw, 4.15rem); line-height: .95; letter-spacing: -.05em; margin: 8px 0 18px; }\nh3 { margin: 0 0 8px; font-size: 1.18rem; color: #211b16; }\np, li { color: #5b5048; font-size: 1.05rem; line-height: 1.72; }\n.ledger-summary { border-left: 4px solid #9a5431; padding-left: 24px; }\n.ledger-summary p { font-size: 1.18rem; color: #3b3029; }\n.ledger-actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 24px; }\n.button { display: inline-flex; min-height: 46px; align-items: center; justify-content: center; padding: 0 18px; border-radius: 999px; text-decoration: none; font-weight: 850; white-space: nowrap; }\n.button.primary { background: #211b16; color: #fffaf0; }\n.button.secondary { border: 1px solid rgba(33,27,22,.22); background: rgba(255,255,255,.32); }\n.ledger-section { padding: 46px 0; border-top: 1px solid rgba(33,27,22,.13); }\n.opening-note { display: grid; grid-template-columns: 180px minmax(0, 1fr) minmax(0, 1fr); gap: 28px; }\n.claim-list { display: grid; gap: 0; border: 1px solid rgba(33,27,22,.14); background: rgba(255,255,255,.28); }\n.claim-row, .proof-row { display: grid; grid-template-columns: 64px minmax(180px,.4fr) minmax(0,.8fr); gap: 20px; padding: 20px; border-bottom: 1px solid rgba(33,27,22,.12); align-items: start; }\n.claim-row:last-child, .proof-row:last-child { border-bottom: 0; }\n.claim-row p, .proof-row p { margin: 0; }\n.section-heading { max-width: 780px; margin-bottom: 24px; }\n.entry-list { display: grid; gap: 18px; }\n.ledger-entry { display: grid; grid-template-columns: 86px minmax(0,1fr); gap: 22px; padding: 24px 0; border-top: 1px solid rgba(33,27,22,.1); }\n.entry-number { font-family: Georgia, serif; font-size: 3.8rem; color: rgba(154,84,49,.34); line-height: .9; }\n.proof-ledger > div:last-child { border: 1px solid rgba(33,27,22,.14); }\n.limits { display: grid; grid-template-columns: minmax(0,.8fr) minmax(0,1fr); gap: 36px; }\n.limits ul { margin: 0; padding-left: 20px; }\n.cta { display: flex; justify-content: space-between; align-items: center; gap: 24px; padding-bottom: 80px; }\n@media (max-width: 850px) { .ledger-hero-grid, .opening-note, .limits, .cta { grid-template-columns: 1fr; display: grid; } .ledger-nav { align-items: flex-start; flex-direction: column; padding-bottom: 42px; } .claim-row, .proof-row { grid-template-columns: 1fr; gap: 8px; } .ledger-entry { grid-template-columns: 1fr; } .button { width: 100%; } }\n`;
}

function buildProductCockpitIndexAstro() {
  const navLinks = '<a href="#context">Context</a><a href="#panels">Panels</a><a href="#proof">Proof</a><a href="#boundaries">Boundaries</a>';
  const audienceItems = audience.map((item) => `<li>${escapeHtml(item)}</li>`).join('\n');
  const statusItems = allowedClaims.slice(0, 4).map((claim, index) => {
    const labels = ['Delivery', 'QA', 'Guardrails', 'Mode'];
    return `<div><span>${labels[index] || 'Claim'}</span><strong>${escapeHtml(claim)}</strong></div>`;
  }).join('\n');
  const workflowCards = sections.map((section, index) => `\n        <article class="cockpit-card">\n          <span class="card-label">${String(index + 1).padStart(2, '0')} · ${escapeHtml(section.navLabel)}</span>\n          <h3>${escapeHtml(section.title)}</h3>\n          <p>${escapeHtml(section.body)}</p>\n        </article>`).join('\n');
  const proofHtml = proofArtifacts.map((item) => `\n        <article>\n          <span class="artifact-path">Repo-verifiable artifact</span>\n          <h3>${escapeHtml(item.label)}</h3>\n          <p>${escapeHtml(item.body)}</p>\n        </article>`).join('\n');
  const boundaryItems = [
    ...forbiddenClaims.slice(0, 3).map((claim) => `<p><strong>Not claimed:</strong> ${escapeHtml(safeVisibleClaim(claim))}.</p>`),
    ...approvalRequired.slice(0, 3).map((item) => `<p><strong>Approval required:</strong> ${escapeHtml(safeVisibleClaim(item))}.</p>`)
  ].slice(0, 6).join('\n');
  const evidenceStrip = usesCopyEvidenceStrip ? buildCopyEvidenceStripMarkup('cockpit') : '';
  return `---\nimport BaseLayout from '../layouts/BaseLayout.astro';\nimport '../styles/global.css';\n${usesArtifactGallery ? "import ArtifactGallery from '../components/ArtifactGallery.astro';\n" : ''}${usesRoadmapBoard ? "import RoadmapBoard from '../components/RoadmapBoard.astro';\n" : ''}${usesSearchIndex ? "import SearchIndex from '../components/SearchIndex.astro';\n" : ''}${usesAgentSiteAtlas ? "import AgentSiteAtlas from '../components/AgentSiteAtlas.astro';\n" : ''}${usesAgentRunLedger ? "import AgentRunLedger from '../components/AgentRunLedger.astro';\n" : ''}${usesFeatureRequestInbox ? "import FeatureRequestInbox from '../components/FeatureRequestInbox.astro';\n" : ''}${usesChiefOfStaffBriefing ? "import ChiefOfStaffBriefing from '../components/ChiefOfStaffBriefing.astro';\n" : ''}---\n<BaseLayout title="${attr(projectName)}" description="${attr(description)}">\n  <main>\n    <section class="hero cockpit-shell" id="top">\n      <nav class="nav" aria-label="Primary navigation">\n        <a class="brand" href="#top" aria-label="${attr(projectName)} home"><span class="brand-mark">${escapeHtml(projectName.slice(0, 1).toUpperCase())}</span><span>${escapeHtml(projectName)}</span></a>\n        <div class="nav-links">${navLinks}</div>\n      </nav>\n\n      <div class="hero-grid">\n        <div class="hero-copy">\n          <p class="eyebrow">Static AgentSite · product-cockpit recipe · no-payment mode</p>\n          <h1>${escapeHtml(heroHeadline.replace(/\.$/, ''))}</h1>\n          <p class="hero-lede">${escapeHtml(heroLede)}</p>\n          <p class="workflow-lede">The page explains the user-facing workflow first, then gives reviewers the operating context, repo-local proof, and approval boundaries needed to evaluate the next step safely.</p>\n          <div class="hero-actions"><a class="button primary" href="${attr(primaryCtaHref)}">${escapeHtml(primaryCtaLabel)}</a><a class="button secondary" href="${attr(repoUrl)}">View source</a></div>\n        </div>\n\n        <aside class="cockpit-card hero-panel" aria-label="${attr(projectName)} static cockpit summary">\n          <div class="panel-header"><span class="pulse-dot" aria-hidden="true"></span><strong>agentsite / status</strong></div>\n          <div class="status-stack">${statusItems}</div>\n          <p class="panel-note">Static-safe presentation only: no analytics, payments, backend, authentication, live telemetry, fake metrics, customer logos, or quoted endorsements.</p>\n        </aside>\n      </div>\n    </section>\n\n    <section class="section split-section" id="context">\n      <div>\n        <div class="section-kicker">Operating context</div>\n        <h2>What decision this page helps visitors make</h2>\n      </div>\n      <div>\n        <p>${escapeHtml(description)}</p>\n        <p>${escapeHtml(brief)}</p>\n      </div>\n    </section>${evidenceStrip}${usesArtifactGallery ? buildArtifactGalleryMarkup() : ''}${usesRoadmapBoard ? buildRoadmapBoardMarkup() : ''}${usesSearchIndex ? buildSearchIndexMarkup() : ''}${usesChiefOfStaffBriefing ? buildChiefOfStaffBriefingMarkup() : ''}${usesFeatureRequestInbox ? buildFeatureRequestInboxMarkup() : ''}${usesAgentRunLedger ? buildAgentRunLedgerMarkup() : ''}${usesAgentSiteAtlas ? buildAgentSiteAtlasMarkup() : ''}\n\n    <section class="section audience" id="audience">\n      <div class="section-kicker">Audience named in the brief</div>\n      <h2>Built for the people who need the workflow explained clearly.</h2>\n      <ul>${audienceItems}</ul>\n    </section>\n\n    <section class="section cockpit-grid-section" id="panels">\n      <div class="section-heading">\n        <div class="section-kicker">Cockpit panels</div>\n        <h2>Status, workflow, proof, and constraints in one scan.</h2>\n      </div>\n      <div class="cockpit-grid">${workflowCards}\n      </div>\n    </section>\n\n    <section class="section artifact-section" id="proof">\n      <div class="section-heading">\n        <div class="section-kicker">Proof artifacts</div>\n        <h2>Evidence a future maintainer can verify.</h2>\n      </div>\n      <div class="artifact-grid">${proofHtml}\n      </div>\n    </section>\n\n    <section class="section boundary-section" id="boundaries">\n      <div class="section-kicker">Boundaries</div>\n      <h2>What is not claimed here.</h2>\n      <div class="boundary-list">${boundaryItems}</div>\n    </section>\n\n    <section class="section cta" id="cta">\n      <div><div class="section-kicker">Safe next step</div><h2>${escapeHtml(primaryCtaLabel)}</h2><p>Use the cockpit panels, repository contracts, and QA commands before changing claims, scope, payments, analytics, or deployment settings.</p></div>\n      <a class="button primary" href="${attr(primaryCtaHref)}">${escapeHtml(primaryCtaLabel)}</a>\n    </section>\n  </main>\n</BaseLayout>\n`;
}

function buildProductCockpitGlobalCss() {
  return `:root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #070b16; color: #edf2ff; }\n* { box-sizing: border-box; }\nhtml { scroll-behavior: smooth; overflow-x: hidden; }\nbody { margin: 0; min-height: 100vh; overflow-x: hidden; background: linear-gradient(90deg, rgba(255,255,255,.035) 1px, transparent 1px) 0 0 / 76px 76px, radial-gradient(circle at 10% 6%, rgba(133, 243, 215, .2), transparent 28rem), radial-gradient(circle at 86% 12%, rgba(159, 183, 255, .16), transparent 34rem), radial-gradient(circle at 50% 92%, rgba(133, 243, 215, .08), transparent 32rem), #070b16; }\nbody::before { content: ""; position: fixed; inset: 0; pointer-events: none; background: linear-gradient(180deg, transparent, rgba(7, 11, 22, .56)); }\na { color: inherit; }\n.hero, .section { position: relative; width: min(1160px, calc(100% - 32px)); margin: 0 auto; }\n.hero { padding: 28px 0 72px; }\n.cockpit-shell::after { content: ""; position: absolute; inset: 84px -20px auto auto; width: 240px; height: 240px; border: 1px solid rgba(133, 243, 215, .16); border-radius: 999px; opacity: .72; pointer-events: none; }\n.nav { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 72px; }\n.brand, .nav-links { display: flex; align-items: center; gap: 12px; text-decoration: none; }\n.brand { font-weight: 800; }\n.brand-mark { display: grid; place-items: center; width: 36px; height: 36px; border: 1px solid rgba(133, 243, 215, .42); border-radius: 12px; background: linear-gradient(135deg, #85f3d7, #9fb7ff); color: #071016; font-weight: 900; box-shadow: 0 0 34px rgba(133, 243, 215, .2); }\n.nav-links { flex-wrap: wrap; justify-content: flex-end; }\n.nav-links a { color: #c8d2ec; text-decoration: none; font-size: .94rem; }\n.hero-grid { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(320px, .95fr); gap: 34px; align-items: stretch; }\n.hero-copy { align-self: center; }\n.eyebrow, .section-kicker, .card-label, .artifact-path, .status-stack span { color: #85f3d7; font-family: "JetBrains Mono", monospace; text-transform: uppercase; letter-spacing: .09em; font-size: .76rem; }\nh1 { max-width: 860px; font-size: clamp(2.65rem, 7.5vw, 5.9rem); line-height: .91; margin: 0 0 24px; letter-spacing: -.07em; }\nh2 { font-size: clamp(2rem, 4.3vw, 3.55rem); line-height: .98; margin: 10px 0 18px; letter-spacing: -.05em; }\nh3 { margin: 0 0 10px; color: #f7f9ff; }\np, li { color: #b8c3de; line-height: 1.7; font-size: 1.04rem; }\n.hero-lede, .workflow-lede { max-width: 760px; font-size: 1.18rem; }\n.workflow-lede { color: #d5def6; }\n.hero-actions { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 30px; }\n.button { display: inline-flex; align-items: center; justify-content: center; min-height: 48px; padding: 0 20px; border-radius: 999px; text-decoration: none; font-weight: 800; }\n.button.primary { background: #85f3d7; color: #071016; box-shadow: 0 16px 42px rgba(133, 243, 215, .18); }\n.button.secondary { border: 1px solid rgba(237,242,255,.2); background: rgba(255,255,255,.055); }\n.cockpit-card, .audience, .split-section, .cta, .boundary-section, .artifact-grid article { border: 1px solid rgba(237,242,255,.13); background: linear-gradient(180deg, rgba(255,255,255,.085), rgba(255,255,255,.035)), rgba(8, 14, 29, .76); box-shadow: 0 24px 90px rgba(0,0,0,.28); backdrop-filter: blur(16px); }\n.cockpit-card { position: relative; overflow: hidden; border-radius: 24px; padding: 24px; }\n.cockpit-card::before { content: ""; position: absolute; inset: 0 0 auto; height: 3px; background: linear-gradient(90deg, #85f3d7, rgba(159, 183, 255, .24), transparent); }\n.hero-panel { min-height: 100%; padding: 0; }\n.panel-header { display: flex; align-items: center; gap: 10px; padding: 18px 20px; border-bottom: 1px solid rgba(237,242,255,.11); }\n.panel-header strong { margin-left: auto; color: #dbe5ff; font: 700 .78rem "JetBrains Mono", monospace; letter-spacing: .06em; text-transform: uppercase; }\n.pulse-dot { width: 10px; height: 10px; border-radius: 50%; background: #85f3d7; box-shadow: 0 0 0 8px rgba(133, 243, 215, .1); }\n.status-stack { display: grid; gap: 12px; padding: 20px; }\n.status-stack div { padding: 16px; border: 1px solid rgba(237,242,255,.1); border-radius: 16px; background: rgba(5, 9, 20, .48); }\n.status-stack strong { display: block; margin-top: 6px; color: #f7f9ff; font-size: 1.02rem; }\n.panel-note { margin: 0 20px 20px; padding: 15px; border: 1px dashed rgba(159, 183, 255, .3); border-radius: 16px; color: #c9d3ee; }\n.section { padding: 54px 0; }\n.split-section, .audience, .boundary-section, .cta { border-radius: 30px; padding: clamp(24px, 5vw, 48px); margin-bottom: 24px; }\n.split-section { display: grid; grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr); gap: 28px; align-items: center; }\n.audience ul { display: grid; gap: 10px; margin: 24px 0 0; padding-left: 22px; }\n.section-heading { max-width: 820px; margin-bottom: 24px; }\n.cockpit-grid, .artifact-gallery-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 18px; }\n.cockpit-grid .cockpit-card:nth-child(1), .cockpit-grid .cockpit-card:nth-child(4) { grid-column: span 2; }\n.artifact-grid article { border-radius: 22px; padding: 22px; }\n.artifact-path { display: inline-block; margin-bottom: 12px; color: #9fb7ff; text-transform: none; letter-spacing: 0; }\n.boundary-list { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-top: 24px; }\n.boundary-list p { margin: 0; padding: 18px; border: 1px solid rgba(237,242,255,.1); border-radius: 18px; background: rgba(5, 9, 20, .42); }\n.boundary-list strong { color: #f7f9ff; }\n.cta { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 80px; }\n.cta p { max-width: 720px; }\n@media (max-width: 940px) { .hero-grid, .split-section, .boundary-list { grid-template-columns: 1fr; } .cockpit-grid, .artifact-gallery-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .cockpit-grid .cockpit-card:nth-child(1), .cockpit-grid .cockpit-card:nth-child(4) { grid-column: span 1; } }\n@media (max-width: 680px) { .nav, .cta { align-items: flex-start; flex-direction: column; } .hero { padding-bottom: 40px; } .cockpit-shell::after { display: none; } .nav { margin-bottom: 48px; } .cockpit-grid, .artifact-gallery-grid { grid-template-columns: 1fr; } .button { width: 100%; } }\n`;
}


function buildCopyEvidenceStripMarkup(variant = 'default') {
  const pairs = allowedClaims.slice(0, 4).map((claim, index) => {
    const artifact = proofArtifacts[index % proofArtifacts.length];
    return `
        <article class="evidence-strip-card">
          <span class="evidence-strip-label">Claim ${String(index + 1).padStart(2, '0')}</span>
          <h3>${escapeHtml(claim)}</h3>
          <p><strong>Evidence:</strong> ${escapeHtml(artifact.label)} — ${escapeHtml(artifact.body)}</p>
        </article>`;
  }).join('\n');
  const heading = variant === 'cockpit'
    ? 'Every strong line gets paired with a verifiable artifact.'
    : 'Claims stay attached to evidence future agents can inspect.';
  return `\n\n    <section class="section evidence-strip" id="evidence-strip" aria-label="Copy evidence strip">
      <div class="evidence-strip-heading">
        <div class="section-kicker">Copy evidence strip</div>
        <h2>${heading}</h2>
      </div>
      <div class="evidence-strip-track">${pairs}
      </div>
    </section>`;
}

function buildCopyEvidenceStripCss(tone = 'dark') {
  const isLight = tone === 'light';
  const cardBg = isLight ? 'rgba(255,255,255,.42)' : 'linear-gradient(180deg, rgba(133,243,215,.12), rgba(255,255,255,.04)), rgba(8,14,29,.76)';
  const textColor = isLight ? '#5b5048' : '#c1cbe5';
  const strongColor = isLight ? '#211b16' : '#f4f7ff';
  const accentColor = isLight ? '#9a5431' : '#85f3d7';
  return `\n.evidence-strip { padding-top: 20px; padding-bottom: 42px; }\n.evidence-strip-heading { max-width: 820px; margin-bottom: 18px; }\n.evidence-strip-heading h2 { margin: 6px 0 0; }\n.evidence-strip-track { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }\n.evidence-strip-card { position: relative; min-height: 210px; padding: 20px; border: 1px solid rgba(237,242,255,.14); border-radius: 22px; background: ${cardBg}; box-shadow: 0 18px 64px rgba(0,0,0,.22); overflow: hidden; }\n.evidence-strip-card::after { content: ""; position: absolute; inset: auto 16px 16px auto; width: 58px; height: 58px; border: 1px solid rgba(133,243,215,.18); border-radius: 18px; transform: rotate(12deg); }\n.evidence-strip-label { display: inline-flex; margin-bottom: 14px; color: ${accentColor}; font: 700 .72rem "JetBrains Mono", monospace; text-transform: uppercase; letter-spacing: .09em; }\n.evidence-strip-card h3 { font-size: 1.05rem; line-height: 1.35; margin: 0 0 14px; }\n.evidence-strip-card p { margin: 0; font-size: .94rem; line-height: 1.6; color: ${textColor}; }\n.evidence-strip-card strong { color: ${strongColor}; }\n@media (max-width: 900px) { .evidence-strip-heading { grid-template-columns: 1fr; } .evidence-strip-track { grid-template-columns: repeat(2, minmax(0, 1fr)); } }\n@media (max-width: 640px) { .evidence-strip-track { grid-template-columns: 1fr; } .evidence-strip-card { min-height: auto; } }\n`;
}


function buildArtifactGalleryMarkup() {
  return `

    <ArtifactGallery />`;
}

function buildArtifactsData() {
  const baseArtifacts = [
    {
      title: 'Site contract',
      type: 'contract',
      status: 'verified',
      tags: ['contracts', 'guardrails', 'agents'],
      href: `${repoUrl}/blob/main/.agent/site.contract.yaml`,
      summary: 'Defines mission, required sections, allowed claims, approval boundaries, and live verification expectations.'
    },
    {
      title: 'Brand contract',
      type: 'contract',
      status: 'verified',
      tags: ['brand', 'voice', 'guardrails'],
      href: `${repoUrl}/blob/main/.agent/brand.contract.yaml`,
      summary: 'Captures tone, visual posture, accessibility posture, and language future agents should avoid.'
    },
    {
      title: 'QA command suite',
      type: 'qa',
      status: 'verified',
      tags: ['qa', 'build', 'verification'],
      href: `${repoUrl}/blob/main/package.json`,
      summary: 'Runs contract, claims, SEO, link, artifact, build, and visual checks before handoff.'
    },
    {
      title: 'Deploy verifier',
      type: 'deploy',
      status: 'verified',
      tags: ['deploy', 'github-pages', 'verification'],
      href: `${repoUrl}/blob/main/scripts/verify-deploy.mjs`,
      summary: 'Checks the live GitHub Pages URL for stable expected text after deployment.'
    },
    {
      title: 'Initial build plan',
      type: 'plan',
      status: 'planned',
      tags: ['plan', 'handoff', 'agents'],
      href: `${repoUrl}/blob/main/.hermes/plans/initial-site-build.md`,
      summary: 'Records the original brief, assumptions, non-goals, acceptance criteria, and verification commands.'
    },
    {
      title: 'Recipe registry',
      type: 'recipe',
      status: 'verified',
      tags: ['recipes', 'patterns', 'agents'],
      href: `${repoUrl}/blob/main/.agent/recipes/README.md`,
      summary: 'Documents reusable archetypes and section recipes future agents can score before applying.'
    }
  ];
  for (const item of proofArtifacts) {
    baseArtifacts.push({
      title: item.label,
      type: 'evidence',
      status: 'static',
      tags: ['proof', 'evidence'],
      href: '#proof',
      summary: item.body
    });
  }
  return baseArtifacts;
}

function buildArtifactGalleryCss(tone = 'dark') {
  const light = tone === 'light';
  const panel = light ? 'rgba(255,255,255,.58)' : 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.035)), rgba(8,14,29,.82)';
  const border = light ? 'rgba(33,27,22,.14)' : 'rgba(237,242,255,.14)';
  const text = light ? '#5b5048' : '#c1cbe5';
  const strong = light ? '#211b16' : '#f7f9ff';
  const accent = light ? '#9a5431' : '#85f3d7';
  const inputBg = light ? 'rgba(255,255,255,.72)' : 'rgba(4,8,18,.72)';
  return `
.artifact-gallery { padding-top: 26px; padding-bottom: 58px; }
.artifact-gallery-heading { display: grid; grid-template-columns: minmax(0, .95fr) minmax(260px, .55fr); gap: 24px; align-items: end; margin-bottom: 22px; }
.artifact-gallery-heading h2 { margin: 6px 0 0; }
.artifact-gallery-heading p { margin: 0; color: ${text}; }
.artifact-controls { display: grid; grid-template-columns: minmax(220px, 340px) 1fr; gap: 14px; align-items: center; margin: 18px 0 12px; }
.artifact-search-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.artifact-controls input { width: 100%; min-height: 48px; border: 1px solid ${border}; border-radius: 999px; background: ${inputBg}; color: ${strong}; padding: 0 18px; font: inherit; font-size: 1rem; outline: none; }
.artifact-controls input:focus, .artifact-tags button:focus, .artifact-link:focus { outline: 3px solid color-mix(in srgb, ${accent} 62%, transparent); outline-offset: 3px; }
.artifact-tags { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
.artifact-tags button { min-height: 42px; border: 1px solid ${border}; border-radius: 999px; background: transparent; color: ${text}; padding: 0 15px; font: 800 .82rem Inter, sans-serif; cursor: pointer; }
.artifact-tags button.active { background: ${accent}; color: ${light ? '#fffaf1' : '#061014'}; border-color: ${accent}; }
.artifact-count { margin: 0 0 16px; color: ${text}; font-size: .95rem; }
.artifact-gallery-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.artifact-card { display: flex; flex-direction: column; min-height: 260px; padding: 20px; border: 1px solid ${border}; border-radius: 24px; background: ${panel}; box-shadow: 0 20px 72px rgba(0,0,0,.16); }
.artifact-card[hidden] { display: none; }
.artifact-card-top { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 18px; color: ${accent}; font: 800 .72rem Inter, sans-serif; text-transform: uppercase; letter-spacing: .1em; }
.artifact-card h3 { color: ${strong}; margin: 0 0 10px; }
.artifact-card p { color: ${text}; margin: 0 0 18px; font-size: .98rem; line-height: 1.6; }
.artifact-chip-row { display: flex; flex-wrap: wrap; gap: 7px; margin-top: auto; }
.artifact-chip-row span { border: 1px solid ${border}; border-radius: 999px; color: ${text}; padding: 4px 9px; font-size: .76rem; }
.artifact-link { display: inline-flex; align-items: center; justify-content: center; align-self: flex-start; min-height: 38px; margin-top: 18px; padding: 0 12px; border: 1px solid ${border}; border-radius: 999px; color: ${accent}; font-weight: 800; text-decoration: none; }
@media (max-width: 900px) { .artifact-gallery-heading, .artifact-controls { grid-template-columns: 1fr; } .artifact-tags { justify-content: flex-start; } .artifact-gallery-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 640px) { .artifact-gallery-grid { grid-template-columns: 1fr; } .artifact-card { min-height: auto; } }
`;
}


function buildRoadmapBoardMarkup() {
  return `

    <RoadmapBoard />`;
}

function buildRoadmapData() {
  return [
    { title: 'Tighten recipe selection', status: 'now', priority: 'high', owner: 'agent', tags: ['recipes', 'qa'], summary: 'Keep selector rules deterministic as more section recipes compose together.', nextStep: 'Add a regression config whenever selector behavior changes.' },
    { title: 'Local-first user overrides', status: 'next', priority: 'high', owner: 'agent', tags: ['local-first', 'browser'], summary: 'Let visitors locally move roadmap cards without implying shared task updates.', nextStep: 'Use localStorage for browser-only status overrides and keep durable changes in JSON.' },
    { title: 'Static intelligence index', status: 'later', priority: 'medium', owner: 'agent', tags: ['search', 'data'], summary: 'Generate precomputed indexes that make static sites feel more queryable.', nextStep: 'Prototype a JSON index from recipe, artifact, and roadmap metadata.' },
    { title: 'Autonomous maintenance cadence', status: 'blocked', priority: 'medium', owner: 'human', tags: ['orchestration', 'approval'], summary: 'Define when recurring agents may propose changes without adding notification noise.', nextStep: 'Approve a quiet schedule and escalation boundaries before automation.' },
    ...proofArtifacts.slice(0, 2).map((item, index) => ({ title: `${item.label} follow-up`, status: index === 0 ? 'now' : 'next', priority: index === 0 ? 'high' : 'medium', owner: 'agent', tags: ['proof', 'handoff'], summary: item.body, nextStep: 'Keep this proof item linked to a real repo artifact before strengthening copy.' }))
  ];
}

function buildRoadmapBoardCss(tone = 'dark') {
  const light = tone === 'light';
  const panel = light ? 'rgba(255,255,255,.62)' : 'linear-gradient(180deg, rgba(255,255,255,.08), rgba(255,255,255,.035)), rgba(8,14,29,.84)';
  const border = light ? 'rgba(33,27,22,.14)' : 'rgba(237,242,255,.14)';
  const text = light ? '#5b5048' : '#c1cbe5';
  const strong = light ? '#211b16' : '#f7f9ff';
  const accent = light ? '#9a5431' : '#85f3d7';
  const inputBg = light ? 'rgba(255,255,255,.72)' : 'rgba(4,8,18,.72)';
  return `
.roadmap-board { padding-top: 30px; padding-bottom: 58px; }
.roadmap-heading { display: grid; grid-template-columns: minmax(0, .95fr) minmax(260px, .55fr); gap: 24px; align-items: end; margin-bottom: 22px; }
.roadmap-heading h2 { margin: 6px 0 0; }
.roadmap-heading p { margin: 0; color: ${text}; }
.roadmap-controls { display: grid; grid-template-columns: minmax(220px, 340px) 1fr; gap: 14px; align-items: center; margin: 18px 0 12px; }
.roadmap-search-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.roadmap-controls input, .roadmap-card select { width: 100%; min-height: 46px; border: 1px solid ${border}; border-radius: 999px; background: ${inputBg}; color: ${strong}; padding: 0 14px; font: inherit; outline: none; }
.roadmap-controls input:focus, .roadmap-filter-row button:focus, .roadmap-card select:focus { outline: 3px solid color-mix(in srgb, ${accent} 62%, transparent); outline-offset: 3px; }
.roadmap-filter-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
.roadmap-filter-row button { min-height: 42px; border: 1px solid ${border}; border-radius: 999px; background: transparent; color: ${text}; padding: 0 15px; font: 800 .82rem Inter, sans-serif; cursor: pointer; }
.roadmap-filter-row button.active { background: ${accent}; color: ${light ? '#fffaf1' : '#061014'}; border-color: ${accent}; }
.roadmap-count { margin: 0 0 16px; color: ${text}; font-size: .95rem; }
.roadmap-columns { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; align-items: start; }
.roadmap-column { min-height: 260px; border: 1px solid ${border}; border-radius: 24px; background: ${light ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.03)'}; padding: 14px; }
.roadmap-column h3 { color: ${strong}; margin: 0 0 12px; }
.roadmap-column[data-empty] { opacity: .62; }
.roadmap-stack { display: grid; gap: 12px; }
.roadmap-card { padding: 16px; border: 1px solid ${border}; border-radius: 20px; background: ${panel}; box-shadow: 0 18px 58px rgba(0,0,0,.14); }
.roadmap-card[hidden] { display: none; }
.roadmap-card-top { display: flex; justify-content: space-between; gap: 12px; margin-bottom: 12px; color: ${accent}; font: 800 .72rem Inter, sans-serif; text-transform: uppercase; letter-spacing: .1em; }
.roadmap-card h4 { margin: 0 0 8px; color: ${strong}; font-size: 1rem; }
.roadmap-card p { color: ${text}; margin: 0 0 12px; font-size: .92rem; line-height: 1.55; }
.roadmap-next strong { color: ${strong}; }
.roadmap-tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0; }
.roadmap-tags span { border: 1px solid ${border}; border-radius: 999px; color: ${text}; padding: 3px 8px; font-size: .72rem; }
.roadmap-card label span { display: block; margin-bottom: 6px; color: ${accent}; font: 800 .72rem Inter, sans-serif; text-transform: uppercase; letter-spacing: .08em; }
@media (max-width: 1050px) { .roadmap-columns { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 900px) { .roadmap-heading, .roadmap-controls { grid-template-columns: 1fr; } .roadmap-filter-row { justify-content: flex-start; } }
@media (max-width: 640px) { .roadmap-columns { grid-template-columns: 1fr; } }
`;
}


function buildSearchIndexMarkup() {
  return `

    <SearchIndex />`;
}

function buildInitialSearchIndexData() {
  return [
    { title: 'Site contract', type: 'contract', href: '#proof', summary: 'Public source of truth for mission, required sections, allowed claims, and approval boundaries.', tags: ['contract', 'claims', 'approval'] },
    { title: 'Recipe registry', type: 'recipe', href: '#proof', summary: 'Agent-readable registry of reusable archetypes and section recipes selected for this static site.', tags: ['recipes', 'agents', 'patterns'] },
    { title: 'Artifact gallery', type: 'recipe', href: '#artifacts', summary: 'Searchable proof browser backed by public-safe static artifact data.', tags: ['artifact-gallery', 'proof', 'static'] },
    { title: 'Roadmap board', type: 'roadmap', href: '#roadmap', summary: 'Local-first improvement board with browser-local status overrides and JSON-backed durable state.', tags: ['roadmap', 'local-first', 'state'] },
    { title: 'Deploy verifier', type: 'artifact', href: '#proof', summary: 'Repo-local command that verifies live GitHub Pages content and latest deploy status.', tags: ['deploy', 'github-pages', 'qa'] },
    { title: 'Initial build plan', type: 'plan', href: '#proof', summary: 'Agent handoff plan describing assumptions, scope, non-goals, QA, and deploy verification.', tags: ['plan', 'handoff', 'qa'] },
    ...proofArtifacts.slice(0, 3).map((item) => ({ title: item.label, type: 'artifact', href: '#proof', summary: item.body, tags: ['artifact', 'proof'] }))
  ];
}

function buildSearchIndexCss(tone = 'dark') {
  const light = tone === 'light';
  const border = light ? 'rgba(33,27,22,.14)' : 'rgba(237,242,255,.14)';
  const text = light ? '#5b5048' : '#c1cbe5';
  const strong = light ? '#211b16' : '#f7f9ff';
  const accent = light ? '#9a5431' : '#85f3d7';
  const panel = light ? 'rgba(255,255,255,.58)' : 'linear-gradient(180deg, rgba(159,183,255,.10), rgba(255,255,255,.035)), rgba(8,14,29,.78)';
  const inputBg = light ? 'rgba(255,255,255,.72)' : 'rgba(4,8,18,.72)';
  return `
.search-index { padding-top: 30px; padding-bottom: 58px; }
.search-index-heading { display: grid; grid-template-columns: minmax(0, .95fr) minmax(260px, .55fr); gap: 24px; align-items: end; margin-bottom: 20px; }
.search-index-heading h2 { margin: 6px 0 0; }
.search-index-heading p { margin: 0; color: ${text}; }
.search-index-controls { display: grid; grid-template-columns: minmax(320px, .9fr) minmax(260px, 1.1fr); gap: 14px; align-items: center; margin: 18px 0 12px; }
.search-index-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.search-index input { width: 100%; min-height: 46px; border: 1px solid ${border}; border-radius: 999px; background: ${inputBg}; color: ${strong}; padding: 0 14px; font: inherit; outline: none; }
.search-index input:focus, .search-index-filters button:focus { outline: 3px solid color-mix(in srgb, ${accent} 62%, transparent); outline-offset: 3px; }
.search-index-filters { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
.search-index-filters button { min-height: 42px; border: 1px solid ${border}; border-radius: 999px; background: transparent; color: ${text}; padding: 0 15px; font: 800 .82rem Inter, sans-serif; cursor: pointer; text-transform: capitalize; }
.search-index-filters button.active { background: ${accent}; color: ${light ? '#fffaf1' : '#061014'}; border-color: ${accent}; }
.search-index-count { margin: 0 0 16px; color: ${text}; font-size: .95rem; }
.search-index-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
.search-index-card { padding: 18px; border: 1px solid ${border}; border-radius: 22px; background: ${panel}; box-shadow: 0 18px 58px rgba(0,0,0,.16); }
.search-index-card[hidden] { display: none; }
.search-index-card > span { color: ${accent}; font: 800 .72rem Inter, sans-serif; text-transform: uppercase; letter-spacing: .12em; }
.search-index-card h3 { color: ${strong}; margin: 10px 0 8px; }
.search-index-card p { color: ${text}; margin: 0 0 12px; font-size: .95rem; line-height: 1.55; }
.search-index-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 12px; }
.search-index-tags em { border: 1px solid ${border}; border-radius: 999px; color: ${text}; padding: 3px 8px; font-style: normal; font-size: .72rem; }
.search-index-card a { color: ${accent}; font-weight: 800; text-decoration: none; }
@media (max-width: 980px) { .search-index-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .search-index-heading, .search-index-controls { grid-template-columns: 1fr; } .search-index-filters { justify-content: flex-start; } }
@media (max-width: 640px) { .search-index-grid { grid-template-columns: 1fr; } }
`;
}


function buildAgentSiteAtlasMarkup() {
  return `

    <AgentSiteAtlas />`;
}

function buildAtlasData() {
  return JSON.parse(fs.readFileSync(path.join(scriptDir, '..', 'src', 'data', 'atlas.json'), 'utf8')).map((site) => ({
    ...site,
    name: site.name === 'Generator Pilot' ? projectName : site.name,
    repo: site.name === 'Generator Pilot' ? `${owner}/${repoName}` : site.repo,
    liveUrl: site.name === 'Generator Pilot' ? liveUrl : site.liveUrl,
    summary: site.name === 'Generator Pilot' ? description : site.summary
  }));
}

function buildAgentSiteAtlasCss(tone = 'dark') {
  const light = tone === 'light';
  const border = light ? 'rgba(33,27,22,.14)' : 'rgba(237,242,255,.14)';
  const text = light ? '#5b5048' : '#c1cbe5';
  const strong = light ? '#211b16' : '#f7f9ff';
  const accent = light ? '#9a5431' : '#85f3d7';
  const panel = light ? 'rgba(255,255,255,.62)' : 'linear-gradient(180deg, rgba(133,243,215,.10), rgba(255,255,255,.035)), rgba(8,14,29,.78)';
  const inputBg = light ? 'rgba(255,255,255,.72)' : 'rgba(4,8,18,.72)';
  return `
.agentsite-atlas { padding-top: 30px; padding-bottom: 58px; }
.atlas-heading { display: grid; grid-template-columns: minmax(0, .95fr) minmax(260px, .55fr); gap: 24px; align-items: end; margin-bottom: 20px; }
.atlas-heading h2 { margin: 6px 0 0; }
.atlas-heading p { margin: 0; color: ${text}; }
.atlas-controls { display: grid; grid-template-columns: minmax(320px, .8fr) minmax(280px, 1.2fr); gap: 14px; align-items: center; margin: 18px 0 12px; }
.atlas-search-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.atlas-controls input { width: 100%; min-height: 46px; border: 1px solid ${border}; border-radius: 999px; background: ${inputBg}; color: ${strong}; padding: 0 14px; font: inherit; outline: none; }
.atlas-controls input:focus, .atlas-filter-row button:focus { outline: 3px solid color-mix(in srgb, ${accent} 62%, transparent); outline-offset: 3px; }
.atlas-filter-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
.atlas-filter-row button { min-height: 42px; border: 1px solid ${border}; border-radius: 999px; background: transparent; color: ${text}; padding: 0 13px; font: 800 .78rem Inter, sans-serif; cursor: pointer; }
.atlas-filter-row button.active { background: ${accent}; color: ${light ? '#fffaf1' : '#061014'}; border-color: ${accent}; }
.atlas-count { margin: 0 0 16px; color: ${text}; }
.atlas-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.atlas-card { padding: 20px; border: 1px solid ${border}; border-radius: 24px; background: ${panel}; box-shadow: 0 20px 62px rgba(0,0,0,.16); }
.atlas-card[hidden] { display: none; }
.atlas-card-top { display: flex; justify-content: space-between; gap: 12px; color: ${accent}; font: 800 .72rem Inter, sans-serif; text-transform: uppercase; letter-spacing: .1em; }
.atlas-card h3 { color: ${strong}; margin: 12px 0 8px; }
.atlas-card p { color: ${text}; margin: 0 0 12px; line-height: 1.55; }
.atlas-card dl { display: grid; grid-template-columns: 1fr 1.4fr; gap: 8px; margin: 14px 0; }
.atlas-card dt { color: ${accent}; font: 800 .68rem Inter, sans-serif; text-transform: uppercase; letter-spacing: .08em; }
.atlas-card dd { margin: 0; color: ${text}; overflow-wrap: anywhere; }
.atlas-tags { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0; }
.atlas-tags span { border: 1px solid ${border}; border-radius: 999px; color: ${text}; padding: 3px 8px; font-size: .72rem; }
.atlas-next strong { color: ${strong}; }
.atlas-actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 14px; }
.atlas-actions a { color: ${accent}; font-weight: 800; text-decoration: none; }
@media (max-width: 980px) { .atlas-heading, .atlas-controls { grid-template-columns: 1fr; } .atlas-filter-row { justify-content: flex-start; } }
@media (max-width: 760px) { .atlas-grid { grid-template-columns: 1fr; } .atlas-card dl { grid-template-columns: 1fr; } }
`;
}


function buildAgentRunLedgerMarkup() {
  return `

    <AgentRunLedger />`;
}

function buildRunLedgerData() {
  return JSON.parse(fs.readFileSync(path.join(scriptDir, '..', 'src', 'data', 'runs.json'), 'utf8')).map((run) => ({
    ...run,
    title: run.id === 'layer-6-agent-run-ledger' ? `${projectName} launch run` : run.title,
    outcome: run.id === 'layer-6-agent-run-ledger' ? description : run.outcome
  }));
}

function buildAgentRunLedgerCss(tone = 'dark') {
  const light = tone === 'light';
  const border = light ? 'rgba(33,27,22,.14)' : 'rgba(237,242,255,.14)';
  const text = light ? '#5b5048' : '#c1cbe5';
  const strong = light ? '#211b16' : '#f7f9ff';
  const accent = light ? '#9a5431' : '#85f3d7';
  const panel = light ? 'rgba(255,255,255,.64)' : 'linear-gradient(180deg, rgba(133,243,215,.09), rgba(255,255,255,.035)), rgba(8,14,29,.80)';
  const inputBg = light ? 'rgba(255,255,255,.72)' : 'rgba(4,8,18,.72)';
  return `
.agent-run-ledger { padding-top: 30px; padding-bottom: 58px; }
.run-ledger-heading { display: grid; grid-template-columns: minmax(0, .95fr) minmax(260px, .55fr); gap: 24px; align-items: end; margin-bottom: 20px; }
.run-ledger-heading h2 { margin: 6px 0 0; }
.run-ledger-heading p { margin: 0; color: ${text}; }
.run-ledger-controls { display: grid; grid-template-columns: minmax(320px, .8fr) minmax(280px, 1.2fr); gap: 14px; align-items: center; margin: 18px 0 12px; }
.run-ledger-search-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.run-ledger-controls input { width: 100%; min-height: 46px; border: 1px solid ${border}; border-radius: 999px; background: ${inputBg}; color: ${strong}; padding: 0 14px; font: inherit; outline: none; }
.run-ledger-controls input:focus, .run-ledger-filter-row button:focus { outline: 3px solid color-mix(in srgb, ${accent} 62%, transparent); outline-offset: 3px; }
.run-ledger-filter-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
.run-ledger-filter-row button { min-height: 42px; border: 1px solid ${border}; border-radius: 999px; background: transparent; color: ${text}; padding: 0 13px; font: 800 .78rem Inter, sans-serif; cursor: pointer; }
.run-ledger-filter-row button.active { background: ${accent}; color: ${light ? '#fffaf1' : '#061014'}; border-color: ${accent}; }
.run-ledger-count { margin: 0 0 16px; color: ${text}; }
.run-ledger-timeline { display: grid; gap: 16px; }
.run-card { padding: 20px; border: 1px solid ${border}; border-radius: 24px; background: ${panel}; box-shadow: 0 20px 62px rgba(0,0,0,.16); }
.run-card[hidden] { display: none; }
.run-card-top { display: flex; justify-content: space-between; gap: 12px; color: ${accent}; font: 800 .72rem Inter, sans-serif; text-transform: uppercase; letter-spacing: .1em; }
.run-card h3 { color: ${strong}; margin: 12px 0 8px; }
.run-card p { color: ${text}; margin: 0 0 12px; line-height: 1.55; }
.run-card dl { display: grid; grid-template-columns: .5fr .7fr 1.4fr; gap: 10px; margin: 14px 0; }
.run-card dt { color: ${accent}; font: 800 .68rem Inter, sans-serif; text-transform: uppercase; letter-spacing: .08em; }
.run-card dd { margin: 0; color: ${text}; overflow-wrap: anywhere; }
.run-lists { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 14px 0; }
.run-lists h4 { color: ${strong}; margin: 0 0 8px; font-size: .86rem; }
.run-lists ul { margin: 0; padding-left: 18px; color: ${text}; }
.run-lists li { margin: 4px 0; }
.run-next strong { color: ${strong}; }
.run-deploy { color: ${accent}; font-weight: 800; text-decoration: none; }
@media (max-width: 980px) { .run-ledger-heading, .run-ledger-controls, .run-card dl, .run-lists { grid-template-columns: 1fr; } .run-ledger-filter-row { justify-content: flex-start; } }
`;
}


function buildFeatureRequestInboxMarkup() {
  return `

    <FeatureRequestInbox />`;
}

function buildRequestInboxData() {
  return JSON.parse(fs.readFileSync(path.join(scriptDir, '..', 'src', 'data', 'requests.json'), 'utf8')).map((request) => ({
    ...request,
    title: request.id === 'req-003' ? `${projectName} launch request` : request.title,
    summary: request.id === 'req-003' ? description : request.summary
  }));
}

function buildFeatureRequestInboxCss(tone = 'dark') {
  const light = tone === 'light';
  const border = light ? 'rgba(33,27,22,.14)' : 'rgba(237,242,255,.14)';
  const text = light ? '#5b5048' : '#c1cbe5';
  const strong = light ? '#211b16' : '#f7f9ff';
  const accent = light ? '#9a5431' : '#85f3d7';
  const panel = light ? 'rgba(255,255,255,.64)' : 'linear-gradient(180deg, rgba(133,243,215,.09), rgba(255,255,255,.035)), rgba(8,14,29,.80)';
  const inputBg = light ? 'rgba(255,255,255,.72)' : 'rgba(4,8,18,.72)';
  return `
.feature-request-inbox { padding-top: 30px; padding-bottom: 58px; }
.request-inbox-heading { display: grid; grid-template-columns: minmax(0, .95fr) minmax(260px, .55fr); gap: 24px; align-items: end; margin-bottom: 20px; }
.request-inbox-heading h2 { margin: 6px 0 0; }
.request-inbox-heading p { margin: 0; color: ${text}; }
.request-inbox-controls { display: grid; grid-template-columns: minmax(320px, .8fr) minmax(230px, .75fr) minmax(230px, .75fr); gap: 14px; align-items: center; margin: 18px 0 12px; }
.request-search-label { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.request-inbox-controls input { width: 100%; min-height: 46px; border: 1px solid ${border}; border-radius: 999px; background: ${inputBg}; color: ${strong}; padding: 0 14px; font: inherit; outline: none; }
.request-inbox-controls input:focus, .request-filter-row button:focus { outline: 3px solid color-mix(in srgb, ${accent} 62%, transparent); outline-offset: 3px; }
.request-filter-row { display: flex; flex-wrap: wrap; gap: 8px; justify-content: flex-end; }
.request-filter-row button { min-height: 42px; border: 1px solid ${border}; border-radius: 999px; background: transparent; color: ${text}; padding: 0 13px; font: 800 .78rem Inter, sans-serif; cursor: pointer; }
.request-filter-row button.active { background: ${accent}; color: ${light ? '#fffaf1' : '#061014'}; border-color: ${accent}; }
.request-count { margin: 0 0 16px; color: ${text}; }
.request-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.request-card { padding: 20px; border: 1px solid ${border}; border-radius: 24px; background: ${panel}; box-shadow: 0 20px 62px rgba(0,0,0,.16); }
.request-card[hidden] { display: none; }
.request-card-top { display: flex; justify-content: space-between; gap: 12px; color: ${accent}; font: 800 .72rem Inter, sans-serif; text-transform: uppercase; letter-spacing: .1em; }
.request-card h3 { color: ${strong}; margin: 12px 0 8px; }
.request-card p { color: ${text}; margin: 0 0 12px; line-height: 1.55; }
.request-card dl { display: grid; grid-template-columns: .7fr 1.4fr; gap: 10px; margin: 14px 0; }
.request-card dt { color: ${accent}; font: 800 .68rem Inter, sans-serif; text-transform: uppercase; letter-spacing: .08em; }
.request-card dd { margin: 0; color: ${text}; overflow-wrap: anywhere; }
.request-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin: 14px 0; }
.request-columns h4 { color: ${strong}; margin: 0 0 8px; font-size: .86rem; }
.request-columns ul { margin: 0; padding-left: 18px; color: ${text}; }
.request-columns li { margin: 4px 0; }
.request-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.request-tags span { border: 1px solid ${border}; border-radius: 999px; color: ${text}; padding: 3px 8px; font-size: .72rem; }
@media (max-width: 1080px) { .request-inbox-controls { grid-template-columns: 1fr; } .request-filter-row { justify-content: flex-start; } }
@media (max-width: 800px) { .request-inbox-heading, .request-grid, .request-card dl, .request-columns { grid-template-columns: 1fr; } }
`;
}


function buildChiefOfStaffBriefingMarkup() {
  return `

    <ChiefOfStaffBriefing />`;
}

function buildInitialBriefingData() {
  const requestData = buildRequestInboxData();
  const runData = buildRunLedgerData();
  const roadmapData = buildRoadmapData();
  return {
    id: 'chief-of-staff-briefing',
    generatedAt: today,
    summary: `Static chief-of-staff briefing for ${projectName}, generated from public AgentSite request, roadmap, run, atlas, and search data.`,
    topActions: [
      { title: 'Review highest-priority request', rationale: requestData.find((request) => request.priority === 'high')?.summary || description, source: 'requests', href: '#requests' },
      { title: 'Verify latest run evidence', rationale: runData.at(-1)?.outcome || 'Check latest static run evidence before delegation.', source: 'runs', href: '#runs' },
      { title: 'Pick the next scoped recipe', rationale: roadmapData[0]?.nextStep || 'Choose the smallest recipe-backed improvement that passes QA.', source: 'roadmap', href: '#roadmap' }
    ],
    riskFlags: [
      { title: 'Static-only boundary', rationale: 'Briefing is generated from committed public JSON, not live monitoring or private task data.', source: 'briefing', href: '#briefing' },
      { title: 'Dense page composition', rationale: 'Multiple modules can bury the primary decision surface; keep the briefing near the top.', source: 'visual review', href: '#briefing' }
    ],
    staleOrBlocked: requestData.filter((request) => ['blocked', 'backlog', 'triage'].includes(request.status)).slice(0, 3).map((request) => ({ title: request.title, rationale: request.nextAction, source: `request:${request.id}`, href: '#requests' })),
    recentWins: runData.filter((run) => run.status === 'verified').slice(-3).reverse().map((run) => ({ title: run.title, rationale: run.outcome, source: `run:${run.id}`, href: '#runs' })),
    recommendedRecipe: {
      id: 'chief-of-staff-briefing',
      reason: 'Use the briefing when requests, roadmap, runs, atlas, and search data need to become one next-action control panel.',
      verification: ['npm run build:briefing', 'npm run check:briefing', 'npm run qa:full']
    },
    evidenceSources: [
      { label: 'Requests', count: requestData.length, href: '#requests' },
      { label: 'Roadmap', count: roadmapData.length, href: '#roadmap' },
      { label: 'Runs', count: runData.length, href: '#runs' },
      { label: 'Atlas', count: buildAtlasData().length, href: '#atlas' },
      { label: 'Search index', count: buildInitialSearchIndexData().length, href: '#search' }
    ]
  };
}

function buildChiefOfStaffBriefingCss(tone = 'dark') {
  const light = tone === 'light';
  const border = light ? 'rgba(33,27,22,.14)' : 'rgba(237,242,255,.14)';
  const text = light ? '#5b5048' : '#c1cbe5';
  const strong = light ? '#211b16' : '#f7f9ff';
  const accent = light ? '#9a5431' : '#85f3d7';
  const panel = light ? 'rgba(255,255,255,.68)' : 'linear-gradient(180deg, rgba(133,243,215,.10), rgba(255,255,255,.035)), rgba(8,14,29,.82)';
  return `
.chief-briefing { padding-top: 30px; padding-bottom: 58px; }
.briefing-heading { display: grid; grid-template-columns: minmax(0, .95fr) minmax(260px, .55fr); gap: 24px; align-items: end; margin-bottom: 20px; }
.briefing-heading h2 { margin: 6px 0 0; }
.briefing-heading p { margin: 0; color: ${text}; }
.briefing-surface { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(280px, .85fr); gap: 16px; }
.briefing-panel { padding: 20px; border: 1px solid ${border}; border-radius: 24px; background: ${panel}; box-shadow: 0 22px 70px rgba(0,0,0,.18); }
.briefing-actions { grid-row: span 2; }
.briefing-panel-top { display: flex; justify-content: space-between; gap: 12px; color: ${accent}; font: 800 .72rem Inter, sans-serif; text-transform: uppercase; letter-spacing: .1em; }
.briefing-panel h3 { color: ${strong}; margin: 12px 0 12px; }
.briefing-panel ol, .briefing-panel ul { margin: 0; padding-left: 20px; }
.briefing-panel li { margin: 0 0 14px; color: ${text}; }
.briefing-panel a { color: ${strong}; font-weight: 850; text-decoration: none; }
.briefing-panel p { color: ${text}; margin: 4px 0; line-height: 1.55; }
.briefing-panel small { color: ${accent}; font: 700 .72rem Inter, sans-serif; text-transform: uppercase; letter-spacing: .08em; }
.briefing-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px; }
.briefing-tags span { border: 1px solid ${border}; border-radius: 999px; color: ${text}; padding: 5px 9px; font-size: .74rem; }
.briefing-details { margin-top: 16px; border: 1px solid ${border}; border-radius: 18px; padding: 14px 16px; background: ${light ? 'rgba(255,255,255,.42)' : 'rgba(8,14,29,.54)'}; color: ${text}; }
.briefing-details summary { cursor: pointer; color: ${strong}; font-weight: 800; }
.briefing-details div { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 12px; }
.briefing-details a { color: ${accent}; text-decoration: none; font-weight: 800; }
@media (max-width: 980px) { .briefing-heading, .briefing-surface { grid-template-columns: 1fr; } .briefing-actions { grid-row: auto; } }
`;
}

function publishProject() {
  console.log('\nPublish requested; checking GitHub CLI authentication...');
  run('gh', ['auth', 'status']);
  const ghLogin = output('gh', ['api', 'user', '--jq', '.login']).trim();
  const ghId = output('gh', ['api', 'user', '--jq', '.id']).trim();
  run('git', ['init'], { cwd: outDir });
  run('git', ['checkout', '-B', 'main'], { cwd: outDir });
  run('git', ['config', 'user.name', ghLogin], { cwd: outDir });
  run('git', ['config', 'user.email', `${ghId}+${ghLogin}@users.noreply.github.com`], { cwd: outDir });
  run('npm', ['install'], { cwd: outDir });
  run('npm', ['run', 'qa'], { cwd: outDir });
  run('git', ['add', '.'], { cwd: outDir });
  run('git', ['commit', '-m', `feat: launch ${repoName} agentsite`], { cwd: outDir });
  run('gh', ['repo', 'create', `${owner}/${repoName}`, '--public', '--source', outDir, '--remote', 'origin', '--push'], { cwd: outDir });
  try { run('gh', ['api', `repos/${owner}/${repoName}/pages`, '-X', 'POST', '-f', 'build_type=workflow']); }
  catch { console.log('Pages API setup skipped or already configured; workflow deploy may still configure Pages.'); }
  console.log('\nPublished scaffold. Watch deploy:');
  console.log(`  gh run watch --repo ${owner}/${repoName}`);
  console.log(`  LIVE_URL="${liveUrl}" EXPECT_TEXT="${projectName}" REPO="${owner}/${repoName}" npm run verify:deploy`);
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) fail(`Unexpected positional argument: ${token}`);
    const [rawKey, inline] = token.slice(2).split('=');
    const key = rawKey.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    if (['publish', 'force', 'auto-recipes', 'help', 'h'].includes(rawKey)) {
      parsed[key] = inline === undefined ? true : inline !== 'false';
      continue;
    }
    const value = inline !== undefined ? inline : argv[++i];
    if (value === undefined || value.startsWith('--')) fail(`Missing value for --${rawKey}`);
    parsed[key] = value;
  }
  return parsed;
}

function loadConfig(configPath) {
  const resolved = path.resolve(String(configPath));
  let text;
  try { text = fs.readFileSync(resolved, 'utf8'); }
  catch (error) { fail(`Could not read --config ${resolved}: ${error.message}`); }
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) fail(`Config JSON must be an object: ${resolved}`);
    return parsed;
  } catch (error) {
    fail(`Invalid config JSON at ${resolved}: ${error.message}`);
  }
}

function mergeConfigAndArgs(configValues, cliValues) {
  const merged = { ...configValues, ...cliValues };
  delete merged.config;
  return merged;
}

function normalizeSections(value, fallbackBrief, fallbackAudience) {
  const defaultSections = [
    { id: 'brief', title: 'The brief in plain language', body: fallbackBrief },
    { id: 'audience-fit', title: 'Who the site speaks to', body: `Primary readers include ${fallbackAudience.join(', ')}.` },
    { id: 'safe-delivery', title: 'Safe static delivery', body: 'The repository includes contracts, QA scripts, and GitHub Pages deployment without analytics, payments, or server runtime.' }
  ];
  const source = value === undefined ? defaultSections : value;
  if (!Array.isArray(source) || source.length === 0) fail('config.sections must be a non-empty array when provided');
  const seen = new Set(['top', 'proof', 'cta']);
  return source.map((section, index) => {
    if (!section || typeof section !== 'object' || Array.isArray(section)) fail(`config.sections[${index}] must be an object`);
    const id = cleanText(section.id, `sections[${index}].id`);
    if (!/^[a-z][a-z0-9-]*$/.test(id)) fail(`Invalid section id "${id}". Use lowercase letters, numbers, and dashes; start with a letter.`);
    if (seen.has(id)) fail(`Duplicate or reserved section id "${id}"`);
    seen.add(id);
    return {
      id,
      title: cleanText(section.title, `sections[${index}].title`),
      body: cleanText(section.body, `sections[${index}].body`),
      navLabel: present(section.navLabel) ? cleanText(section.navLabel, `sections[${index}].navLabel`) : shortNavLabel(section.title, id)
    };
  });
}

function normalizeProofArtifacts(value) {
  const source = value === undefined ? [
    { label: 'Repo contracts', body: 'Site, brand, and payment contracts define safe edit boundaries.' },
    { label: 'QA command', body: '`npm run qa` checks contracts, claims, links, SEO basics, and production build.' },
    { label: 'Deployment evidence', body: 'GitHub Pages deploy verification is documented in the generated README.' }
  ] : value;
  if (!Array.isArray(source) || source.length === 0) fail('config.proofArtifacts must be a non-empty array when provided');
  return source.map((item, index) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) fail(`config.proofArtifacts[${index}] must be an object`);
    return { label: cleanText(item.label, `proofArtifacts[${index}].label`), body: cleanText(item.body, `proofArtifacts[${index}].body`) };
  });
}

function normalizeOptionalStringArray(value, name) {
  if (value === undefined) return [];
  const source = Array.isArray(value) ? value : String(value).split(',');
  const cleaned = source.map((item, index) => {
    const raw = String(item).replace(/\s+/g, ' ').trim();
    return raw ? cleanText(raw, `${name}[${index}]`) : '';
  }).filter(Boolean);
  for (const item of cleaned) {
    if (!/^[a-z0-9][a-z0-9._-]*$/.test(item)) fail(`config.${name} entries must be lowercase recipe IDs; received "${item}"`);
  }
  return cleaned;
}

function normalizeStringArray(value, name, fallback) {
  const source = value === undefined ? fallback : value;
  if (!Array.isArray(source)) fail(`config.${name} must be an array when provided`);
  const cleaned = source.map((item, index) => cleanText(item, `${name}[${index}]`)).filter(Boolean);
  if (!cleaned.length) fail(`config.${name} must include at least one non-empty string`);
  return cleaned;
}

function cleanText(value, label) {
  if (typeof value !== 'string') fail(`${label} must be a string`);
  const text = value.replace(/\s+/g, ' ').trim();
  if (!text) fail(`${label} cannot be empty`);
  return text;
}

function cleanHref(value) {
  const href = cleanText(String(value), 'primaryCtaHref');
  if (/^(javascript|data):/i.test(href)) fail('primaryCtaHref cannot use javascript: or data: URLs');
  return href;
}

function defaultAudience(name) {
  return [`People evaluating ${name}`, 'Maintainers who need clear contracts and QA evidence'];
}

function write(relative, content) {
  const target = path.join(outDir, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function render(template, values) {
  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key) => values[key] ?? '');
}

function mdList(items) {
  return items.map((item) => `- ${item}`).join('\n');
}

function yamlList(items, indent) {
  const pad = ' '.repeat(indent);
  return items.map((item) => `${pad}- ${yamlScalar(item)}`).join('\n');
}

function yamlScalar(value) {
  return JSON.stringify(String(value));
}

function escapeHtml(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

function safeVisibleClaim(value) {
  return String(value).replace(/testimonials?/gi, 'quoted endorsements');
}

function attr(value) {
  return escapeHtml(value);
}

function shortNavLabel(title, id) {
  const phrase = String(title)
    .replace(/[.…]+/g, '')
    .split(/[:;—–-]/)[0]
    .trim();
  if (phrase && phrase.length <= 18) return phrase;
  const stop = new Set(['a', 'an', 'and', 'are', 'for', 'from', 'in', 'into', 'is', 'of', 'on', 'the', 'to', 'who', 'with']);
  const words = phrase.split(/\s+/).filter((word) => word && !stop.has(word.toLowerCase()));
  const picked = [];
  for (const word of words) {
    const next = [...picked, word].join(' ');
    if (next.length > 18) break;
    picked.push(word);
    if (picked.length === 3) break;
  }
  return picked.join(' ') || id.replaceAll('-', ' ');
}

function defaultHeroHeadline(name, desc, sourceBrief, siteSections) {
  const candidate = userFacingSummary(desc, name, 58) || userFacingSummary(siteSections[0]?.title, name, 58) || userFacingSummary(sourceBrief, name, 58) || 'Static site with guardrails';
  const headline = candidate.toLowerCase().includes(name.toLowerCase()) ? candidate : `${name}: ${candidate}`;
  return conciseText(headline, 92);
}

function defaultHeroLede(sourceBrief, desc, name) {
  return userFacingSummary(sourceBrief, name, 220) || userFacingSummary(desc, name, 180) || `${name} is a static AgentSite with contracts, QA, and GitHub Pages deployment evidence.`;
}

function userFacingSummary(value, name, limit) {
  if (!present(value)) return '';
  let text = cleanInstructionCopy(String(value));
  if (/^create\b/i.test(text)) text = '';
  if (!text) return '';
  return conciseText(text.replace(/\.$/, ''), limit);
}

function cleanInstructionCopy(value) {
  return String(value)
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(create|build|design|make|generate)\s+(a|an|the)?\s*/i, '')
    .replace(/^static landing page for\s+/i, '')
    .replace(/^landing page for\s+/i, '')
    .replace(/^(.*?):\s*/, '$1 is ')
    .trim();
}

function conciseText(value, limit) {
  const text = String(value).replace(/[.…]+/g, '').trim();
  if (text.length <= limit) return stripDanglingEnding(text);
  const cut = text.slice(0, limit + 1);
  const boundary = Math.max(cut.lastIndexOf(' '), cut.lastIndexOf(','), cut.lastIndexOf(';'));
  return stripDanglingEnding(text.slice(0, boundary > 42 ? boundary : limit));
}

function stripDanglingEnding(value) {
  return String(value)
    .trim()
    .replace(/[,:;\s]+$/g, '')
    .replace(/\b(and|or|with|for|to|of|in|into|from|that|while|where|before|after)$/i, '')
    .trim()
    .replace(/[,:;\s]+$/g, '');
}

function slug(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
}

function sentenceFromBrief(text, fallback) {
  const first = text.split(/[.!?]\s/)[0]?.trim() || fallback;
  return first.endsWith('.') ? first : `${first}.`;
}

function present(value) {
  return value !== undefined && value !== null && String(value).trim() !== '';
}

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object, key);
}

function kebab(value) {
  return value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);
}

function shellQuote(value) {
  return `'${String(value).replaceAll("'", `'\\''`)}'`;
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, { stdio: 'inherit', ...options });
  if (result.status !== 0) fail(`Command failed: ${command} ${commandArgs.join(' ')}`);
}

function output(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options });
  if (result.status !== 0) fail(`Command failed: ${command} ${commandArgs.join(' ')}\n${result.stderr || ''}`.trim());
  return result.stdout;
}

function usage(code) {
  console.log(`Usage:\n  npm run create:agentsite -- --name "Site Name" --repo repo-name --brief "Natural-language brief" --owner github-owner --out /tmp/repo-name [--description "..."] [--archetype editorial-ledger] [--recipes product-cockpit] [--visual-preset cockpit-dark] [--auto-recipes] [--publish] [--force]\n  npm run create:agentsite -- --config ./agentsite.config.json --out /tmp/repo-name [--name "Override"] [--auto-recipes] [--publish] [--force]\n\nConfig is JSON only. CLI flags override config values. Defaults to local scaffold only; add --publish to create/push a public GitHub repo with gh. Selecting recipes:["product-cockpit"], visualPreset:"cockpit-dark", or visualPreset:"product-cockpit" renders the static-safe cockpit UI. Selecting recipes:["editorial-ledger"], archetype:"editorial-ledger", or visualPreset:"editorial-light" renders the light editorial ledger archetype. Selecting recipes:["copy-evidence-strip"] or visualPreset:"evidence-strip" adds a static-safe claim-to-artifact strip. Selecting recipes:["chief-of-staff-briefing"] or visualPreset:"chief-of-staff-briefing" adds a generated static executive briefing panel. If --auto-recipes or config autoRecipes:true is set and no recipes/visualPreset are explicit, deterministic heuristics may select product-cockpit from the brief, audience, sections, or proofArtifacts; otherwise the default landing-page UI is used.`);
  process.exit(code);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
