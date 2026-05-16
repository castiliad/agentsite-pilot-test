import fs from 'node:fs';

const path = 'src/data/artifacts.json';
if (!fs.existsSync(path)) {
  console.log('artifact check skipped (src/data/artifacts.json not present)');
  process.exit(0);
}

let artifacts;
try {
  artifacts = JSON.parse(fs.readFileSync(path, 'utf8'));
} catch (error) {
  console.error(`artifact data is invalid JSON: ${error.message}`);
  process.exit(1);
}

const failures = [];
const allowedTypes = new Set(['contract', 'qa', 'deploy', 'plan', 'recipe', 'screenshot', 'docs', 'source', 'evidence']);
const seenTitles = new Set();

if (!Array.isArray(artifacts) || artifacts.length < 3) {
  failures.push('src/data/artifacts.json must contain at least three artifacts');
} else {
  artifacts.forEach((item, index) => {
    const label = `artifacts[${index}]`;
    if (!item || typeof item !== 'object' || Array.isArray(item)) failures.push(`${label} must be an object`);
    const title = stringField(item?.title);
    const summary = stringField(item?.summary);
    const type = stringField(item?.type);
    const href = stringField(item?.href);
    const tags = item?.tags;
    if (!title) failures.push(`${label}.title is required`);
    if (title && seenTitles.has(title.toLowerCase())) failures.push(`${label}.title must be unique: ${title}`);
    if (title) seenTitles.add(title.toLowerCase());
    if (!summary || summary.length < 24) failures.push(`${label}.summary must be at least 24 characters`);
    if (!allowedTypes.has(type)) failures.push(`${label}.type must be one of ${[...allowedTypes].join(', ')}`);
    if (!Array.isArray(tags) || tags.length === 0 || tags.some((tag) => !/^[a-z0-9][a-z0-9-]*$/.test(String(tag)))) failures.push(`${label}.tags must be non-empty lowercase slug array`);
    if (!safeHref(href)) failures.push(`${label}.href must be a safe relative path, root path, hash, or https URL`);
    if (/stripe\.com|paypal\.com|paddle\.com|lemonsqueezy\.com|google-analytics|googletagmanager|segment\.com/i.test(href)) failures.push(`${label}.href points at a blocked payment/tracking domain`);
    const combined = `${title} ${summary}`;
    if (/trusted by\s+\d+|guaranteed\s+(results|uptime|revenue|conversion)|testimonial/i.test(combined)) failures.push(`${label} contains unsupported proof language`);
  });
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log(`artifact check passed (${artifacts.length} artifacts)`);

function stringField(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function safeHref(value) {
  const href = stringField(value);
  if (!href) return false;
  if (/^(javascript|data|vbscript):/i.test(href)) return false;
  return href.startsWith('#') || href.startsWith('/') || href.startsWith('./') || href.startsWith('../') || href.startsWith('https://') || /^[a-z0-9._/-]+$/i.test(href);
}
