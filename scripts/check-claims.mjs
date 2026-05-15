import fs from 'node:fs';
import path from 'node:path';

const roots = ['src', 'README.md'];
const blocked = [
  /trusted by\s+\d+/i,
  /\d+[kmb]?\+\s+(customers|users|teams|developers)/i,
  /guaranteed\s+(results|uptime|revenue|conversion)/i,
  /testimonial/i,
  /case study/i,
  /stripe\.com|paypal\.com|paddle\.com|lemonsqueezy\.com/i
];

function walk(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  return fs.readdirSync(target).flatMap((entry) => walk(path.join(target, entry)));
}

const files = roots.flatMap((root) => fs.existsSync(root) ? walk(root) : []).filter((file) => /\.(astro|css|md|js|mjs|ts)$/.test(file));
const failures = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const pattern of blocked) {
    if (pattern.test(text)) failures.push(`${file}: blocked claim/link matched ${pattern}`);
  }
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`claims check passed (${files.length} files scanned)`);
