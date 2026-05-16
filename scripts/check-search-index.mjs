import fs from 'node:fs';

const path = 'src/data/search-index.json';
if (!fs.existsSync(path)) { console.error(`${path} is required`); process.exit(1); }
let entries;
try { entries = JSON.parse(fs.readFileSync(path, 'utf8')); }
catch (error) { console.error(`search index JSON invalid: ${error.message}`); process.exit(1); }
const allowedTypes = new Set(['contract', 'recipe', 'artifact', 'roadmap', 'plan', 'section']);
const failures = [];
if (!Array.isArray(entries) || entries.length < 6) failures.push('search index must contain at least six entries');
const titles = new Set();
const types = new Set();
for (const [index, entry] of (Array.isArray(entries) ? entries : []).entries()) {
  const label = `searchIndex[${index}]`;
  for (const field of ['title', 'type', 'href', 'summary']) if (typeof entry[field] !== 'string' || !entry[field].trim()) failures.push(`${label}.${field} is required`);
  if (entry.type) types.add(entry.type);
  if (entry.title && titles.has(`${entry.type}:${entry.title}`.toLowerCase())) failures.push(`${label} duplicate title/type: ${entry.type}:${entry.title}`);
  if (entry.title) titles.add(`${entry.type}:${entry.title}`.toLowerCase());
  if (entry.type && !allowedTypes.has(entry.type)) failures.push(`${label}.type ${entry.type} is not allowed`);
  if (entry.href && !(entry.href.startsWith('#') || entry.href.startsWith('https://'))) failures.push(`${label}.href must be a hash or https URL`);
  if (!Array.isArray(entry.tags) || entry.tags.length === 0 || entry.tags.some((tag) => !/^[a-z0-9][a-z0-9-]*$/.test(String(tag)))) failures.push(`${label}.tags must be non-empty lowercase slug array`);
  const combined = `${entry.title} ${entry.summary}`;
  if (/secret|token|password|credential|testimonial|guaranteed|trusted by\s+\d+/i.test(combined)) failures.push(`${label} contains blocked public-index language`);
}
for (const type of ['contract', 'recipe', 'artifact']) if (!types.has(type)) failures.push(`search index missing required type: ${type}`);
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`search index check passed (${entries.length} entries, ${types.size} types)`);
