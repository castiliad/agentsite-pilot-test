import fs from 'node:fs';
const path = 'src/data/atlas.json';
if (!fs.existsSync(path)) { console.log('atlas check skipped (src/data/atlas.json not present)'); process.exit(0); }
let sites;
try { sites = JSON.parse(fs.readFileSync(path, 'utf8')); } catch (error) { console.error(`atlas JSON invalid: ${error.message}`); process.exit(1); }
const failures=[];
if (!Array.isArray(sites) || sites.length < 3) failures.push('atlas must contain at least three proof sites');
const repos=new Set();
for (const [i, site] of (Array.isArray(sites)?sites:[]).entries()) {
  const label=`atlas[${i}]`;
  for (const field of ['name','repo','liveUrl','status','archetype','summary','nextStep','deployRun']) if (typeof site[field] !== 'string' || !site[field].trim()) failures.push(`${label}.${field} is required`);
  if (!/^[-\w]+\/[-\w.]+$/.test(site.repo||'')) failures.push(`${label}.repo must be owner/name`);
  if (site.repo && repos.has(site.repo)) failures.push(`${label}.repo duplicate: ${site.repo}`);
  if (site.repo) repos.add(site.repo);
  if (site.liveUrl && !site.liveUrl.startsWith('https://')) failures.push(`${label}.liveUrl must be https`);
  if (site.deployRun && !site.deployRun.startsWith('https://github.com/')) failures.push(`${label}.deployRun must be GitHub URL`);
  if (!['verified','draft','needs-review'].includes(site.status)) failures.push(`${label}.status invalid`);
  if (!Number.isInteger(site.layer) || site.layer < 0) failures.push(`${label}.layer must be non-negative integer`);
  if (!Array.isArray(site.recipes) || site.recipes.length === 0 || site.recipes.some((r)=>!/^[a-z0-9][a-z0-9-]*$/.test(String(r)))) failures.push(`${label}.recipes must be non-empty slug array`);
  if (/secret|token|password|credential|private data|testimonial|guaranteed|trusted by\s+\d+/i.test(`${site.name} ${site.summary} ${site.nextStep}`)) failures.push(`${label} contains blocked atlas language`);
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`atlas check passed (${sites.length} sites)`);
