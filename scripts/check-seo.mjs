import fs from 'node:fs';

const index = fs.readFileSync('src/pages/index.astro', 'utf8');
const layout = fs.readFileSync('src/layouts/BaseLayout.astro', 'utf8');
const requiredText = [
  'Ask for a website in natural language',
  'Natural-language intake',
  'Contract-backed repo setup',
  'Agent task decomposition',
  'Verifiable QA',
  'GitHub Pages delivery'
];

const failures = [];
if (!/<title>/.test(layout)) failures.push('missing <title> in layout');
if (!/meta name="description"/.test(layout)) failures.push('missing meta description');
if (!/<h1>/.test(index)) failures.push('missing h1');
for (const text of requiredText) {
  if (!index.includes(text) && !fs.readFileSync('src/components/Workflow.astro', 'utf8').includes(text)) {
    failures.push(`missing required visible phrase: ${text}`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('seo/content check passed');
