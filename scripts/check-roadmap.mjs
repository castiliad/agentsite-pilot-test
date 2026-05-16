import fs from 'node:fs';

const path = 'src/data/roadmap.json';
if (!fs.existsSync(path)) {
  console.log('roadmap check skipped (src/data/roadmap.json not present)');
  process.exit(0);
}

const allowedStatus = new Set(['now', 'next', 'later', 'blocked']);
const allowedPriority = new Set(['high', 'medium', 'low']);
const failures = [];
let items;
try { items = JSON.parse(fs.readFileSync(path, 'utf8')); }
catch (error) { console.error(`roadmap data is invalid JSON: ${error.message}`); process.exit(1); }

if (!Array.isArray(items) || items.length < 3) failures.push('src/data/roadmap.json must contain at least three roadmap items');
const titles = new Set();
for (const [index, item] of (Array.isArray(items) ? items : []).entries()) {
  const label = `roadmap[${index}]`;
  if (!item || typeof item !== 'object' || Array.isArray(item)) { failures.push(`${label} must be an object`); continue; }
  for (const field of ['title', 'status', 'priority', 'owner', 'summary', 'nextStep']) {
    if (typeof item[field] !== 'string' || !item[field].trim()) failures.push(`${label}.${field} is required`);
  }
  if (item.title && titles.has(item.title.toLowerCase())) failures.push(`${label}.title must be unique: ${item.title}`);
  if (item.title) titles.add(item.title.toLowerCase());
  if (!allowedStatus.has(item.status)) failures.push(`${label}.status must be one of ${[...allowedStatus].join(', ')}`);
  if (!allowedPriority.has(item.priority)) failures.push(`${label}.priority must be one of ${[...allowedPriority].join(', ')}`);
  if (!Array.isArray(item.tags) || item.tags.length === 0 || item.tags.some((tag) => !/^[a-z0-9][a-z0-9-]*$/.test(String(tag)))) failures.push(`${label}.tags must be non-empty lowercase slug array`);
  const combined = `${item.title} ${item.summary} ${item.nextStep}`;
  if (/guaranteed|trusted by\s+\d+|testimonial|live automation|auto[- ]?appl/i.test(combined)) failures.push(`${label} contains unsupported roadmap language`);
}

if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`roadmap check passed (${items.length} items)`);
