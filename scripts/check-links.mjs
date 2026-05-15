import fs from 'node:fs';
import path from 'node:path';

function walk(target) {
  const stat = fs.statSync(target);
  if (stat.isFile()) return [target];
  return fs.readdirSync(target).flatMap((entry) => walk(path.join(target, entry)));
}

const files = walk('src').filter((file) => /\.astro$/.test(file));
const all = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
const ids = new Set([...all.matchAll(/id="([^"]+)"/g)].map((match) => match[1]));
const hrefs = [...all.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
const failures = [];

for (const href of hrefs) {
  if (href.startsWith('#') && !ids.has(href.slice(1))) failures.push(`broken anchor: ${href}`);
  if (/stripe\.com|paypal\.com|paddle\.com|lemonsqueezy\.com/i.test(href)) failures.push(`payment link not allowed: ${href}`);
  if (/google-analytics|googletagmanager|segment\.com/i.test(href)) failures.push(`tracking link not allowed: ${href}`);
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log(`link check passed (${hrefs.length} hrefs, ${ids.size} anchors)`);
