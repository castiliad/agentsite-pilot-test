import fs from 'node:fs';
import path from 'node:path';

const out = 'src/data/briefing.json';
const today = new Date().toISOString().slice(0, 10);

function readJson(file, fallback = []) {
  if (!fs.existsSync(file)) return fallback;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return fallback; }
}

function unique(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = JSON.stringify(item).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function cleanText(value, fallback = '') {
  return String(value || fallback).replace(/\s+/g, ' ').trim();
}

function item(title, rationale, source, href = '#top') {
  return { title: cleanText(title), rationale: cleanText(rationale), source: cleanText(source), href: cleanText(href, '#top') };
}

const requests = readJson('src/data/requests.json');
const roadmap = readJson('src/data/roadmap.json');
const runs = readJson('src/data/runs.json');
const atlas = readJson('src/data/atlas.json');
const searchIndex = readJson('src/data/search-index.json');

const requestActions = requests
  .filter((request) => ['ready', 'in_progress', 'triage'].includes(request.status))
  .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] ?? 3) - ({ high: 0, medium: 1, low: 2 }[b.priority] ?? 3))
  .map((request) => item(request.title, `${request.summary} Next: ${request.nextAction}`, `request:${request.id}`, '#requests'));

const roadmapActions = roadmap
  .filter((entry) => ['now', 'next', 'blocked'].includes(entry.status))
  .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] ?? 3) - ({ high: 0, medium: 1, low: 2 }[b.priority] ?? 3))
  .map((entry) => item(entry.title, `${entry.summary || ''} ${entry.nextStep || ''}`, `roadmap:${entry.id}`, '#roadmap'));

const topActions = unique([...requestActions, ...roadmapActions]).slice(0, 3);

const riskFlags = unique([
  ...requests.filter((request) => request.status === 'blocked' || request.priority === 'high' && request.status === 'backlog')
    .map((request) => item(request.title, `Request is ${request.status} with ${request.priority} priority.`, `request:${request.id}`, '#requests')),
  ...roadmap.filter((entry) => entry.status === 'blocked')
    .map((entry) => item(entry.title, `Roadmap item is blocked. ${entry.nextStep || ''}`, `roadmap:${entry.id}`, '#roadmap')),
  ...runs.filter((run) => run.status !== 'verified')
    .map((run) => item(run.title, `Run status is ${run.status}; deploy or verification may still need curation.`, `run:${run.id}`, '#runs'))
]).slice(0, 4);

const staleOrBlocked = unique([
  ...requests.filter((request) => ['blocked', 'backlog', 'triage'].includes(request.status))
    .map((request) => item(request.title, `Needs triage before implementation. Next: ${request.nextAction}`, `request:${request.id}`, '#requests')),
  ...roadmap.filter((entry) => ['blocked', 'later'].includes(entry.status))
    .map((entry) => item(entry.title, `Deferred or blocked roadmap item. ${entry.nextStep || ''}`, `roadmap:${entry.id}`, '#roadmap'))
]).slice(0, 4);

const recentWins = runs
  .filter((run) => run.status === 'verified')
  .sort((a, b) => Number(b.layer || 0) - Number(a.layer || 0))
  .slice(0, 3)
  .map((run) => item(run.title, run.outcome, `run:${run.id}`, '#runs'));

const candidateCounts = new Map();
for (const request of requests) {
  for (const recipe of request.recipeCandidates || []) candidateCounts.set(recipe, (candidateCounts.get(recipe) || 0) + (request.priority === 'high' ? 2 : 1));
}
for (const entry of roadmap) {
  for (const tag of entry.tags || []) if (/recipe|brief|inbox|ledger|atlas|search|roadmap|artifact/.test(tag)) candidateCounts.set(tag, (candidateCounts.get(tag) || 0) + 1);
}
const [recommendedId = 'feature-request-inbox'] = [...candidateCounts.entries()].sort((a, b) => b[1] - a[1])[0] || [];

const briefing = {
  id: 'chief-of-staff-briefing',
  generatedAt: today,
  summary: 'Static chief-of-staff briefing generated from public AgentSite data: requests, roadmap, runs, atlas, and search index.',
  topActions: topActions.length ? topActions : [item('Add a scoped request', 'No ready request was available, so the next action is to add a public-safe request with acceptance criteria.', 'briefing', '#requests')],
  riskFlags: riskFlags.length ? riskFlags : [item('No high-risk public blockers found', 'Current public-safe data does not expose blocked high-priority work.', 'briefing', '#briefing')],
  staleOrBlocked,
  recentWins,
  recommendedRecipe: {
    id: recommendedId,
    reason: `Most relevant candidate in the current public request/roadmap data: ${recommendedId}.`,
    verification: ['npm run build:briefing', 'npm run check:briefing', 'npm run qa:full']
  },
  evidenceSources: [
    { label: 'Requests', count: requests.length, href: '#requests' },
    { label: 'Roadmap', count: roadmap.length, href: '#roadmap' },
    { label: 'Runs', count: runs.length, href: '#runs' },
    { label: 'Atlas', count: atlas.length, href: '#atlas' },
    { label: 'Search index', count: searchIndex.length, href: '#search' }
  ]
};

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(briefing, null, 2)}\n`);
console.log(`chief-of-staff briefing built (${briefing.topActions.length} top actions, ${briefing.riskFlags.length} risks)`);
