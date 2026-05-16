import fs from 'node:fs';
const path = 'src/data/runs.json';
if (!fs.existsSync(path)) { console.log('run ledger check skipped (src/data/runs.json not present)'); process.exit(0); }
let runs;
try { runs = JSON.parse(fs.readFileSync(path, 'utf8')); } catch (error) { console.error(`run ledger JSON invalid: ${error.message}`); process.exit(1); }
const failures=[];
if (!Array.isArray(runs) || runs.length < 3) failures.push('run ledger must contain at least three runs');
const ids=new Set();
for (const [i, run] of (Array.isArray(runs)?runs:[]).entries()) {
  const label=`runs[${i}]`;
  for (const field of ['id','title','status','date','orchestrator','commit','deployRun','outcome','nextAction']) if (typeof run[field] !== 'string' || !run[field].trim()) failures.push(`${label}.${field} is required`);
  if (run.id && ids.has(run.id)) failures.push(`${label}.id duplicate: ${run.id}`);
  if (run.id) ids.add(run.id);
  if (!['verified','draft','failed','blocked','needs-review'].includes(run.status)) failures.push(`${label}.status invalid`);
  if (!Number.isInteger(run.layer) || run.layer < 0) failures.push(`${label}.layer must be non-negative integer`);
  for (const field of ['delegations','checks']) if (!Array.isArray(run[field]) || run[field].length === 0 || run[field].some((x)=>typeof x !== 'string' || !x.trim())) failures.push(`${label}.${field} must be non-empty string array`);
  if (run.deployRun !== 'pending' && !String(run.deployRun).startsWith('https://github.com/')) failures.push(`${label}.deployRun must be GitHub URL or pending`);
  if (/secret|token|password|credential|private data|testimonial|guaranteed|trusted by\s+\d+/i.test(JSON.stringify(run))) failures.push(`${label} contains blocked run-ledger language`);
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`run ledger check passed (${runs.length} runs)`);
