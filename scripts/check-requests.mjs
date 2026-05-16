import fs from 'node:fs';
const path = 'src/data/requests.json';
if (!fs.existsSync(path)) { console.log('request inbox check skipped (src/data/requests.json not present)'); process.exit(0); }
let requests;
try { requests = JSON.parse(fs.readFileSync(path, 'utf8')); } catch (error) { console.error(`requests JSON invalid: ${error.message}`); process.exit(1); }
const failures=[];
if (!Array.isArray(requests) || requests.length < 3) failures.push('request inbox must contain at least three requests');
const ids=new Set();
for (const [i, request] of (Array.isArray(requests)?requests:[]).entries()) {
  const label=`requests[${i}]`;
  for (const field of ['id','title','status','priority','source','summary','nextAction']) if (typeof request[field] !== 'string' || !request[field].trim()) failures.push(`${label}.${field} is required`);
  if (request.id && ids.has(request.id)) failures.push(`${label}.id duplicate: ${request.id}`);
  if (request.id) ids.add(request.id);
  if (!['triage','ready','in_progress','blocked','backlog','done','rejected'].includes(request.status)) failures.push(`${label}.status invalid`);
  if (!['high','medium','low'].includes(request.priority)) failures.push(`${label}.priority invalid`);
  for (const field of ['acceptance','recipeCandidates','verification']) if (!Array.isArray(request[field]) || request[field].length === 0 || request[field].some((x)=>typeof x !== 'string' || !x.trim())) failures.push(`${label}.${field} must be non-empty string array`);
  if (/secret|token|password|credential|private data|testimonial|guaranteed|trusted by\s+\d+/i.test(JSON.stringify(request))) failures.push(`${label} contains blocked request-inbox language`);
}
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`request inbox check passed (${requests.length} requests)`);
