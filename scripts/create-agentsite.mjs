#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = parseArgs(process.argv.slice(2));

if (args.help || args.h) usage(0);
const required = ['name', 'repo', 'brief', 'out'];
const missing = required.filter((key) => !args[key]);
if (missing.length) fail(`Missing required argument(s): ${missing.map((key) => `--${key}`).join(', ')}`);

const projectName = String(args.name).trim();
const repoName = slug(String(args.repo));
const ownerProvided = Boolean(args.owner);
const owner = ownerProvided ? slug(String(args.owner)) : 'your-github-owner';
const brief = String(args.brief).trim();
const description = args.description ? String(args.description).trim() : sentenceFromBrief(brief, projectName);
const publish = Boolean(args.publish);
const force = Boolean(args.force);
const outDir = path.resolve(String(args.out));
const packageName = repoName;
const liveUrl = `https://${owner}.github.io/${repoName}/`;
const repoUrl = `https://github.com/${owner}/${repoName}`;
const today = new Date().toISOString().slice(0, 10);

if (!projectName) fail('--name cannot be empty');
if (!brief) fail('--brief cannot be empty');
if (!/^[a-z0-9._-]+$/.test(repoName)) fail('--repo must be URL/package safe after slugging (letters, numbers, dot, underscore, dash)');
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
  HERO: `${projectName}: ${description}`
};

const files = new Map(Object.entries({
  '.gitignore': `node_modules/\ndist/\n.astro/\n.DS_Store\n.env\n.env.*\n`,
  'package.json': JSON.stringify({
    name: view.PACKAGE_NAME,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: {
      dev: 'astro dev',
      build: 'astro build',
      preview: 'astro preview',
      qa: 'npm run check:contract && npm run check:claims && npm run check:seo && npm run check:links && npm run build',
      'check:contract': 'node scripts/check-contracts.mjs',
      'check:claims': 'node scripts/check-claims.mjs',
      'check:seo': 'node scripts/check-seo.mjs',
      'check:links': 'node scripts/check-links.mjs',
      'verify:deploy': 'node scripts/verify-deploy.mjs'
    },
    dependencies: {
      astro: '^6.3.3',
      typescript: '^6.0.3'
    }
  }, null, 2) + '\n',
  'astro.config.mjs': `// @ts-check\nimport { defineConfig } from 'astro/config';\n\nexport default defineConfig({\n  site: 'https://{{OWNER}}.github.io',\n  base: '/{{REPO_NAME}}',\n  output: 'static'\n});\n`,
  'README.md': `# {{PROJECT_NAME}}\n\n{{DESCRIPTION}}\n\n## Brief\n{{BRIEF}}\n\n## Live URL\n{{LIVE_URL}}\n\n## Repository\n{{REPO_URL}}\n\n## Local development\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n\n## QA\n\`\`\`bash\nnpm run qa\nnpm audit --audit-level=moderate\n\`\`\`\n\n## Deploy verification\n\`\`\`bash\nLIVE_URL=\"{{LIVE_URL}}\" \\\nEXPECT_TEXT=\"{{EXPECT_TEXT}}\" \\\nREPO=\"{{OWNER_REPO}}\" \\\nnpm run verify:deploy\n\`\`\`\n\n## Agent maintenance notes\n- Read \`AGENTS.md\` before editing.\n- Keep visible copy aligned with \`.agent/site.contract.yaml\` and \`.agent/brand.contract.yaml\`.\n- Payment mode is disabled in \`.agent/payment.contract.yaml\`; do not add payment links without explicit approval.\n- Deployment is GitHub Pages via \`.github/workflows/deploy.yml\`.\n`,
  'AGENTS.md': `# AGENTS.md\n\n## Mission\n{{PROJECT_NAME}} is a static AgentSite generated from this requester brief: {{BRIEF}}\n\n## Stack\n- Astro static site\n- Astro production build checks\n- GitHub Pages via GitHub Actions\n- Lightweight repo-local scripts in \`scripts/\`\n\n## Safe edit boundaries\nAgents may safely edit:\n- \`src/components/**\`, \`src/pages/**\`, \`src/styles/**\`\n- Copy that remains consistent with \`.agent/site.contract.yaml\` and \`.agent/brand.contract.yaml\`\n- Lightweight QA scripts when adding matching checks to \`package.json\`\n- Documentation, runbooks, and plan files that reflect actual behavior\n\n## Approval-required changes\nGet explicit human approval before:\n- Adding analytics, cookies, tracking pixels, or third-party forms\n- Adding payment links or enabling payment mode\n- Configuring custom domains or DNS\n- Making unsupported claims, customer references, benchmarks, or availability promises\n- Changing deployment target away from GitHub Pages\n- Introducing server-side runtime or a database\n\n## QA commands\nRun before handoff:\n\`\`\`bash\nnpm run qa\n\`\`\`\n\nIndividual gates:\n\`\`\`bash\nnpm run check:contract\nnpm run check:claims\nnpm run check:seo\nnpm run check:links\nnpm run build\n\`\`\`\n\n## Feature-request process\n1. Capture the natural-language request as a short brief.\n2. Compare it with \`.agent/site.contract.yaml\`, \`.agent/brand.contract.yaml\`, and \`.agent/payment.contract.yaml\`.\n3. Record assumptions and acceptance criteria in an issue or plan file.\n4. Implement the smallest coherent change.\n5. Run QA and include command output summary in the handoff.\n6. Deploy only after checks pass.\n7. Verify the live URL contains expected current copy.\n`,
  '.agent/site.contract.yaml': `name: {{PROJECT_NAME}} site contract\nversion: 0.1.0\nowner_role: AgentSite maintenance agent\nsite:\n  type: static_landing_page\n  framework: Astro\n  deploy_target: GitHub Pages\n  repository_visibility: public_allowed\nmission: >\n  {{DESCRIPTION}}\nbrief: >\n  {{BRIEF}}\nrequired_sections:\n  - hero\n  - brief_summary\n  - offering\n  - process\n  - qa_status\n  - next_step_cta\ncontent_rules:\n  must_include:\n    - static GitHub Pages delivery\n    - repo-local QA\n    - no-payment mode\n  must_not_include:\n    - fake customer testimonials\n    - fake metrics\n    - unsupported guarantees\n    - analytics or tracking\n    - live payment links\nqa:\n  commands:\n    - npm run qa\n    - npm run build\n`,
  '.agent/brand.contract.yaml': `name: {{PROJECT_NAME}} brand contract\nversion: 0.1.0\nvoice:\n  tone:\n    - crisp\n    - trustworthy\n    - clear\n    - direct\n  avoid:\n    - generic SaaS slop\n    - exaggerated AI magic\n    - fake urgency\n    - fake social proof\nvisual_system:\n  direction: restrained premium static-site landing page\n  colors:\n    background: '#070b16'\n    text: '#edf2ff'\n    accent: '#85f3d7'\n    accent_secondary: '#9fb7ff'\n  typography:\n    sans: Inter\n    mono: JetBrains Mono\naccessibility:\n  responsive: true\n  semantic_sections: true\n  minimum_contrast: high on dark background\n`,
  '.agent/payment.contract.yaml': `name: {{PROJECT_NAME}} payment contract\nversion: 0.1.0\nmode: disabled\nstatus: no-payment\nrules:\n  - Do not add live payment links.\n  - Do not collect card details or billing information.\n  - Do not imply paid availability.\n  - Any payment integration requires explicit human approval and a new contract review.\nallowed_copy:\n  - payment disabled\n  - no-payment mode\nblocked_domains:\n  - stripe.com\n  - paypal.com\n  - paddle.com\n  - lemonsqueezy.com\n`,
  '.agent/runbooks/deploy.md': `# Deployment runbook\n\n## Target\nGitHub Pages serves the static Astro build from the GitHub Actions artifact.\n\n## Normal deployment\n1. Confirm contracts and QA pass: \`npm run qa\`.\n2. Commit changes to \`main\`.\n3. Push to GitHub.\n4. GitHub Actions runs \`.github/workflows/deploy.yml\`.\n5. Verify the live URL contains expected text: \`{{EXPECT_TEXT}}\`.\n\n## Manual verification\n\`\`\`bash\nLIVE_URL=\"{{LIVE_URL}}\" EXPECT_TEXT=\"{{EXPECT_TEXT}}\" REPO=\"{{OWNER_REPO}}\" npm run verify:deploy\n\`\`\`\n\n## Rollback\nRevert the problematic commit, run QA, and push \`main\` again. Do not rewrite public history unless explicitly approved.\n`,
  '.agent/runbooks/feature-request.md': `# Feature request runbook\n\n1. Capture the requester language verbatim.\n2. Translate it into audience, sections, claims allowed, claims disallowed, deployment constraints, and maintenance constraints.\n3. Check against \`.agent/site.contract.yaml\`, \`.agent/brand.contract.yaml\`, and \`.agent/payment.contract.yaml\`.\n4. If the request touches approval-required areas from \`AGENTS.md\`, stop and request approval.\n5. Add or update a plan in \`.hermes/plans/\` for non-trivial work.\n6. Implement in small commits when practical.\n7. Run \`npm run qa\` and capture the result in the handoff.\n8. Verify GitHub Pages after deployment.\n`,
  '.agent/templates/initial-plan.template.md': `# Initial site build plan: [PROJECT_NAME]\n\n## Request\n[Paste or summarize the natural-language request.]\n\n## Assumptions\n- The site remains static and deploys to GitHub Pages unless approved otherwise.\n- No analytics, payments, fake customers, fake metrics, or unsupported claims will be added.\n\n## Scope\n- [What will be built.]\n\n## Acceptance criteria\n- Contracts exist and match visible copy.\n- QA scripts pass locally.\n- GitHub Pages deploy succeeds.\n`,
  '.hermes/plans/initial-site-build.md': `# Initial site build plan: {{PROJECT_NAME}}\n\n## Request\n{{BRIEF}}\n\n## Assumptions\n- The site remains static and deploys to GitHub Pages.\n- No analytics, payments, fake customers, fake metrics, or unsupported claims are included.\n\n## Scope\n- Generate a safe first-pass landing page and repo guardrails.\n\n## Non-goals\n- Payment, analytics, custom domains, server runtime, and unsupported claims.\n\n## Files expected to change\n- \`AGENTS.md\`\n- \`.agent/**\`\n- \`.github/workflows/deploy.yml\`\n- \`package.json\`\n- \`scripts/**\`\n- \`src/**\`\n\n## Acceptance criteria\n- Hero and core sections reflect the brief.\n- Contracts exist and payment remains disabled/no-payment.\n- \`npm run qa\` passes locally.\n- GitHub Pages deploy succeeds and live URL contains \`{{EXPECT_TEXT}}\`.\n\n## QA commands\n\`\`\`bash\nnpm run qa\nnpm audit --audit-level=moderate\n\`\`\`\n\n## Deploy/verify\n\`\`\`bash\nLIVE_URL=\"{{LIVE_URL}}\" EXPECT_TEXT=\"{{EXPECT_TEXT}}\" REPO=\"{{OWNER_REPO}}\" npm run verify:deploy\n\`\`\`\n`,
  '.github/workflows/deploy.yml': `name: Deploy to GitHub Pages\n\non:\n  push:\n    branches: [main]\n  workflow_dispatch:\n\npermissions:\n  contents: read\n  pages: write\n  id-token: write\n\nconcurrency:\n  group: pages\n  cancel-in-progress: false\n\nenv:\n  FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: true\n\njobs:\n  build:\n    runs-on: ubuntu-latest\n    steps:\n      - name: Checkout\n        uses: actions/checkout@v4\n      - name: Setup Node\n        uses: actions/setup-node@v4\n        with:\n          node-version: 22\n          cache: npm\n      - name: Install dependencies\n        run: npm ci\n      - name: Run QA\n        run: npm run qa\n      - name: Upload artifact\n        uses: actions/upload-pages-artifact@v3\n        with:\n          path: ./dist\n\n  deploy:\n    needs: build\n    runs-on: ubuntu-latest\n    environment:\n      name: github-pages\n      url: $\{{ steps.deployment.outputs.page_url }}\n    steps:\n      - name: Deploy to GitHub Pages\n        id: deployment\n        uses: actions/deploy-pages@v4\n`,
  'src/env.d.ts': `/// <reference types=\"astro/client\" />\n`,
  'src/layouts/BaseLayout.astro': `---\nconst { title = '{{PROJECT_NAME}}', description = '{{DESCRIPTION}}' } = Astro.props;\n---\n<!doctype html>\n<html lang=\"en\">\n  <head>\n    <meta charset=\"utf-8\" />\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />\n    <meta name=\"generator\" content={Astro.generator} />\n    <meta name=\"description\" content={description} />\n    <meta property=\"og:title\" content={title} />\n    <meta property=\"og:description\" content={description} />\n    <meta property=\"og:type\" content=\"website\" />\n    <meta name=\"theme-color\" content=\"#0b1020\" />\n    <title>{title}</title>\n    <link rel=\"preconnect\" href=\"https://fonts.googleapis.com\" />\n    <link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin />\n    <link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap\" rel=\"stylesheet\" />\n  </head>\n  <body>\n    <slot />\n  </body>\n</html>\n`,
  'src/pages/index.astro': `---\nimport BaseLayout from '../layouts/BaseLayout.astro';\nimport '../styles/global.css';\n---\n<BaseLayout title=\"{{PROJECT_NAME}}\" description=\"{{DESCRIPTION}}\">\n  <main>\n    <section class=\"hero\" id=\"top\">\n      <nav class=\"nav\" aria-label=\"Primary navigation\">\n        <a class=\"brand\" href=\"#top\" aria-label=\"{{PROJECT_NAME}} home\"><span class=\"brand-mark\">A</span><span>{{PROJECT_NAME}}</span></a>\n        <div class=\"nav-links\"><a href=\"#brief\">Brief</a><a href=\"#process\">Process</a><a href=\"#qa\">QA</a></div>\n      </nav>\n      <div class=\"hero-grid\">\n        <div class=\"hero-copy\">\n          <p class=\"eyebrow\">Static AgentSite · GitHub Pages · no-payment mode</p>\n          <h1>{{HERO}}</h1>\n          <p class=\"hero-lede\">This first-pass site turns the provided brief into a public, maintainable static landing page with contracts, QA scripts, and deployment evidence built into the repository.</p>\n          <div class=\"hero-actions\"><a class=\"button primary\" href=\"#cta\">Review next step</a><a class=\"button secondary\" href=\"{{REPO_URL}}\">View source</a></div>\n        </div>\n        <aside class=\"terminal-card\" aria-label=\"Project summary\"><div class=\"terminal-top\"><span></span><span></span><span></span><strong>agentsite/status</strong></div><div class=\"terminal-body\"><p><span>brief</span> captured</p><p><span>source</span> Astro static site</p><p><span>contracts</span> .agent guardrails</p><p><span>payment</span> disabled</p><p><span>deploy</span> GitHub Pages</p></div></aside>\n      </div>\n    </section>\n\n    <section class=\"section\" id=\"brief\"><div class=\"section-kicker\">Brief</div><h2>What this site is for</h2><p>{{BRIEF}}</p></section>\n    <section class=\"section cards\" id=\"process\"><div class=\"section-kicker\">Process</div><h2>Built for safe iteration</h2><div class=\"card-grid\"><article><h3>Static GitHub Pages delivery</h3><p>No server runtime, database, analytics, or payments are included by default.</p></article><article><h3>Contract-backed edits</h3><p>Future changes should stay aligned with AGENTS.md plus .agent site, brand, and payment contracts.</p></article><article><h3>Repo-local QA</h3><p>Checks validate required guardrails, basic SEO structure, blocked claims, links, and Astro build output.</p></article></div></section>\n    <section class=\"section\" id=\"qa\"><div class=\"section-kicker\">QA status</div><h2>Repeatable handoff gates</h2><p>Run <code>npm run qa</code> before handoff and use <code>npm run verify:deploy</code> after GitHub Pages deployment.</p></section>\n    <section class=\"section cta\" id=\"cta\"><div class=\"cta-card\"><div><div class=\"section-kicker\">Next step</div><h2>Refine this starter with real content and evidence.</h2><p>Keep payment disabled and avoid unsupported claims until explicitly approved.</p></div><a class=\"button primary\" href=\"{{REPO_URL}}\">Open repo</a></div></section>\n  </main>\n</BaseLayout>\n`,
  'src/styles/global.css': `:root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif; background: #070b16; color: #edf2ff; }\n* { box-sizing: border-box; }\nbody { margin: 0; min-height: 100vh; background: radial-gradient(circle at top left, rgba(133, 243, 215, .18), transparent 34rem), #070b16; }\na { color: inherit; }\n.hero, .section { width: min(1120px, calc(100% - 32px)); margin: 0 auto; }\n.hero { padding: 28px 0 80px; }\n.nav { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 72px; }\n.brand, .nav-links { display: flex; align-items: center; gap: 12px; text-decoration: none; }\n.brand-mark { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 10px; background: #85f3d7; color: #071016; font-weight: 800; }\n.nav-links a { opacity: .76; text-decoration: none; }\n.hero-grid { display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(280px, .8fr); gap: 32px; align-items: center; }\n.eyebrow, .section-kicker, .terminal-body span { color: #85f3d7; font-family: \"JetBrains Mono\", monospace; text-transform: uppercase; letter-spacing: .08em; font-size: .78rem; }\nh1 { font-size: clamp(2.4rem, 7vw, 5.6rem); line-height: .95; margin: 0 0 24px; letter-spacing: -.06em; }\nh2 { font-size: clamp(2rem, 4vw, 3.3rem); line-height: 1; margin: 10px 0 18px; letter-spacing: -.04em; }\nh3 { margin-top: 0; }\np { color: #b8c3de; line-height: 1.7; font-size: 1.05rem; }\n.hero-lede { max-width: 680px; font-size: 1.2rem; }\n.hero-actions { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 30px; }\n.button { display: inline-flex; align-items: center; justify-content: center; min-height: 46px; padding: 0 18px; border-radius: 999px; text-decoration: none; font-weight: 700; }\n.button.primary { background: #85f3d7; color: #071016; }\n.button.secondary { border: 1px solid rgba(237,242,255,.18); background: rgba(255,255,255,.05); }\n.terminal-card, article, .cta-card { border: 1px solid rgba(237,242,255,.12); background: rgba(10,16,34,.72); border-radius: 24px; box-shadow: 0 24px 80px rgba(0,0,0,.32); }\n.terminal-top { display: flex; align-items: center; gap: 8px; padding: 16px 18px; border-bottom: 1px solid rgba(237,242,255,.1); color: #9fb7ff; font-family: \"JetBrains Mono\", monospace; }\n.terminal-top span { width: 10px; height: 10px; border-radius: 50%; background: #85f3d7; opacity: .7; }\n.terminal-body { padding: 18px; font-family: \"JetBrains Mono\", monospace; }\n.terminal-body p { display: flex; justify-content: space-between; gap: 18px; margin: 12px 0; font-size: .92rem; }\n.section { padding: 70px 0; }\n.card-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }\narticle { padding: 24px; }\n.cta-card { display: flex; justify-content: space-between; gap: 24px; align-items: center; padding: 28px; }\ncode { color: #85f3d7; }\n@media (max-width: 800px) { .hero-grid, .card-grid { grid-template-columns: 1fr; } .nav, .cta-card { align-items: flex-start; flex-direction: column; } .nav-links { flex-wrap: wrap; } }\n`,
  'scripts/check-contracts.mjs': `import fs from 'node:fs';\n\nconst required = [\n  'AGENTS.md',\n  '.agent/site.contract.yaml',\n  '.agent/brand.contract.yaml',\n  '.agent/payment.contract.yaml',\n  '.agent/runbooks/deploy.md',\n  '.agent/runbooks/feature-request.md',\n  '.hermes/plans/initial-site-build.md'\n];\n\nconst missing = required.filter((file) => !fs.existsSync(file));\nif (missing.length) {\n  console.error(\`Missing required contract files:\\n\${missing.join('\\n')}\`);\n  process.exit(1);\n}\n\nconst payment = fs.readFileSync('.agent/payment.contract.yaml', 'utf8');\nif (!/mode:\\s*disabled/.test(payment) || !/no-payment/.test(payment)) {\n  console.error('Payment contract must stay in disabled/no-payment mode.');\n  process.exit(1);\n}\n\nconsole.log(\`contract check passed (\${required.length} files, payment disabled)\`);\n`,
  'scripts/check-claims.mjs': `import fs from 'node:fs';\nimport path from 'node:path';\n\nconst roots = ['src', 'README.md'];\nconst blocked = [\n  /trusted by\\s+\\d+/i,\n  /\\d+[kmb]?\\+\\s+(customers|users|teams|developers)/i,\n  /guaranteed\\s+(results|uptime|revenue|conversion)/i,\n  /testimonial/i,\n  /case study/i,\n  /stripe\\.com|paypal\\.com|paddle\\.com|lemonsqueezy\\.com/i\n];\n\nfunction walk(target) {\n  const stat = fs.statSync(target);\n  if (stat.isFile()) return [target];\n  return fs.readdirSync(target).flatMap((entry) => walk(path.join(target, entry)));\n}\n\nconst files = roots.flatMap((root) => fs.existsSync(root) ? walk(root) : []).filter((file) => /\\.(astro|css|md|js|mjs|ts)$/.test(file));\nconst failures = [];\nfor (const file of files) {\n  const text = fs.readFileSync(file, 'utf8');\n  for (const pattern of blocked) {\n    if (pattern.test(text)) failures.push(\`\${file}: blocked claim/link matched \${pattern}\`);\n  }\n}\n\nif (failures.length) {\n  console.error(failures.join('\\n'));\n  process.exit(1);\n}\nconsole.log(\`claims check passed (\${files.length} files scanned)\`);\n`,
  'scripts/check-seo.mjs': `import fs from 'node:fs';\n\nconst index = fs.readFileSync('src/pages/index.astro', 'utf8');\nconst layout = fs.readFileSync('src/layouts/BaseLayout.astro', 'utf8');\nconst contract = fs.readFileSync('.agent/site.contract.yaml', 'utf8');\nconst requiredText = ['{{PROJECT_NAME}}', 'GitHub Pages', 'repo-local QA', 'no-payment mode'];\nconst failures = [];\n\nif (!/<title>/.test(layout)) failures.push('missing <title> in layout');\nif (!/meta name=\"description\"/.test(layout)) failures.push('missing meta description');\nif (!/<h1>/.test(index)) failures.push('missing h1');\nfor (const text of requiredText) {\n  if (!index.includes(text) && !contract.includes(text)) failures.push(\`missing required phrase: \${text}\`);\n}\n\nif (failures.length) {\n  console.error(failures.join('\\n'));\n  process.exit(1);\n}\nconsole.log('seo/content check passed');\n`,
  'scripts/check-links.mjs': `import fs from 'node:fs';\nimport path from 'node:path';\n\nfunction walk(target) {\n  const stat = fs.statSync(target);\n  if (stat.isFile()) return [target];\n  return fs.readdirSync(target).flatMap((entry) => walk(path.join(target, entry)));\n}\n\nconst files = walk('src').filter((file) => /\\.astro$/.test(file));\nconst all = files.map((file) => fs.readFileSync(file, 'utf8')).join('\\n');\nconst ids = new Set([...all.matchAll(/id=\"([^\"]+)\"/g)].map((match) => match[1]));\nconst hrefs = [...all.matchAll(/href=\"([^\"]+)\"/g)].map((match) => match[1]);\nconst failures = [];\n\nfor (const href of hrefs) {\n  if (href.startsWith('#') && !ids.has(href.slice(1))) failures.push(\`broken anchor: \${href}\`);\n  if (/stripe\\.com|paypal\\.com|paddle\\.com|lemonsqueezy\\.com/i.test(href)) failures.push(\`payment link not allowed: \${href}\`);\n  if (/google-analytics|googletagmanager|segment\\.com/i.test(href)) failures.push(\`tracking link not allowed: \${href}\`);\n}\n\nif (failures.length) {\n  console.error(failures.join('\\n'));\n  process.exit(1);\n}\nconsole.log(\`link check passed (\${hrefs.length} hrefs, \${ids.size} anchors)\`);\n`,
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
  console.log(`  npm run create:agentsite -- --name ${shellQuote(projectName)} --repo ${shellQuote(repoName)} --brief ${shellQuote(brief)} --owner ${shellQuote(owner)} --out ${shellQuote(outDir)} --publish --force`);
}

function publishProject() {
  if (!ownerProvided) fail('--owner is required when --publish is set');
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
    if (['publish', 'force', 'help', 'h'].includes(rawKey)) {
      parsed[rawKey] = inline === undefined ? true : inline !== 'false';
      continue;
    }
    const value = inline !== undefined ? inline : argv[++i];
    if (value === undefined || value.startsWith('--')) fail(`Missing value for --${rawKey}`);
    parsed[key] = value;
  }
  return parsed;
}

function write(relative, content) {
  const target = path.join(outDir, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

function render(template, values) {
  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key) => values[key] ?? '');
}

function slug(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '');
}

function sentenceFromBrief(text, fallback) {
  const first = text.split(/[.!?]\s/)[0]?.trim() || fallback;
  return first.endsWith('.') ? first : `${first}.`;
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
  console.log(`Usage:\n  npm run create:agentsite -- --name \"Site Name\" --repo repo-name --brief \"Natural-language brief\" --owner github-owner --out /tmp/repo-name [--description \"...\"] [--publish] [--force]\n\nDefaults to local scaffold only. Add --publish to create/push a public GitHub repo with gh.`);
  process.exit(code);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
