import fs from 'node:fs';
const file = 'src/data/briefing.json';
if (!fs.existsSync(file)) { console.log('chief-of-staff briefing check skipped (src/data/briefing.json not present)'); process.exit(0); }
let briefing;
try { briefing = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (error) { console.error(`briefing JSON invalid: ${error.message}`); process.exit(1); }
const failures = [];
const requiredStrings = ['id', 'generatedAt', 'summary'];
for (const field of requiredStrings) if (typeof briefing[field] !== 'string' || !briefing[field].trim()) failures.push(`briefing.${field} is required`);
for (const field of ['topActions', 'riskFlags', 'recentWins', 'evidenceSources']) {
  if (!Array.isArray(briefing[field]) || briefing[field].length === 0) failures.push(`briefing.${field} must be a non-empty array`);
}
if (!Array.isArray(briefing.topActions) || briefing.topActions.length !== 3) failures.push('briefing.topActions must contain exactly three actions');
for (const [field, items] of Object.entries({ topActions: briefing.topActions || [], riskFlags: briefing.riskFlags || [], staleOrBlocked: briefing.staleOrBlocked || [], recentWins: briefing.recentWins || [] })) {
  for (const [index, item] of items.entries()) {
    const label = `${field}[${index}]`;
    for (const key of ['title', 'rationale', 'source', 'href']) if (typeof item[key] !== 'string' || !item[key].trim()) failures.push(`${label}.${key} is required`);
  }
}
if (!briefing.recommendedRecipe || typeof briefing.recommendedRecipe !== 'object') failures.push('briefing.recommendedRecipe is required');
else {
  for (const key of ['id', 'reason']) if (typeof briefing.recommendedRecipe[key] !== 'string' || !briefing.recommendedRecipe[key].trim()) failures.push(`briefing.recommendedRecipe.${key} is required`);
  if (!Array.isArray(briefing.recommendedRecipe.verification) || briefing.recommendedRecipe.verification.length < 2) failures.push('briefing.recommendedRecipe.verification must include verification commands');
}
const serialized = JSON.stringify(briefing);
if (/secret|token|password|credential|private data|raw chats|testimonial|guaranteed|trusted by\s+\d+/i.test(serialized)) failures.push('briefing contains blocked public-safety language');
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
console.log(`chief-of-staff briefing check passed (${briefing.topActions.length} actions, ${briefing.recentWins.length} wins)`);
