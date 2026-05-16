import fs from 'node:fs';
import path from 'node:path';

const out = 'src/data/search-index.json';
const entries = [];
const push = (entry) => entries.push({
  title: String(entry.title || '').trim(),
  type: String(entry.type || '').trim(),
  href: String(entry.href || '#top').trim(),
  summary: String(entry.summary || '').trim(),
  tags: Array.isArray(entry.tags) ? entry.tags.map((tag) => String(tag).trim()).filter(Boolean) : []
});

function readJson(file) {
  if (!fs.existsSync(file)) return null;
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { return null; }
}

const siteContract = fs.existsSync('.agent/site.contract.yaml') ? fs.readFileSync('.agent/site.contract.yaml', 'utf8') : '';
const readme = fs.existsSync('README.md') ? fs.readFileSync('README.md', 'utf8') : '';
const pageSource = fs.existsSync('src/pages/index.astro') ? fs.readFileSync('src/pages/index.astro', 'utf8') : '';
const hasSection = (id, componentName = '') => pageSource.includes(`id=\"${id}\"`) || pageSource.includes(`id="${id}"`) || Boolean(componentName && pageSource.includes(componentName));
if (siteContract) push({ title: 'Site contract', type: 'contract', href: '#proof', summary: 'Public source of truth for site mission, required sections, allowed claims, and approval boundaries.', tags: ['contract', 'claims', 'approval'] });
if (readme) push({ title: 'README handoff', type: 'contract', href: '#top', summary: 'Repository overview, selected recipes, live URL, QA commands, and agent maintenance notes.', tags: ['handoff', 'repo', 'agents'] });

const recipeRoot = '.agent/recipes';
if (fs.existsSync(recipeRoot)) {
  for (const id of fs.readdirSync(recipeRoot).sort()) {
    const yaml = path.join(recipeRoot, id, 'recipe.yaml');
    if (!fs.existsSync(yaml)) continue;
    const text = fs.readFileSync(yaml, 'utf8');
    const name = text.match(/^name:\s*(.+)$/m)?.[1]?.trim() || id;
    const kind = text.match(/^kind:\s*(.+)$/m)?.[1]?.trim() || 'recipe';
    const summary = text.match(/^summary:\s*>\s*\n([\s\S]*?)(?:\n\S|$)/m)?.[1]?.replace(/\s+/g, ' ').trim() || `${name} recipe metadata.`;
    const href = id === 'artifact-gallery' ? (hasSection('artifacts', 'ArtifactGallery') ? '#artifacts' : '#proof')
      : id === 'roadmap-board' ? (hasSection('roadmap', 'RoadmapBoard') ? '#roadmap' : '#proof')
        : id === 'search-index' ? (hasSection('search', 'SearchIndex') ? '#search' : '#proof')
          : id === 'agentsite-atlas' ? (hasSection('atlas', 'AgentSiteAtlas') ? '#atlas' : '#proof')
            : id === 'agent-run-ledger' ? (hasSection('runs', 'AgentRunLedger') ? '#runs' : '#proof')
              : id === 'feature-request-inbox' ? (hasSection('requests', 'FeatureRequestInbox') ? '#requests' : '#proof')
                : id === 'chief-of-staff-briefing' ? (hasSection('briefing', 'ChiefOfStaffBriefing') ? '#briefing' : '#proof')
                  : id === 'primary-surface-layout' ? (hasSection('secondary-modules') ? '#secondary-modules' : '#proof')
                    : '#proof';
    push({ title: name, type: 'recipe', href, summary, tags: [id, kind, 'recipe'] });
  }
}

for (const item of readJson('src/data/artifacts.json') || []) {
  push({ title: item.title, type: 'artifact', href: item.href || '#artifacts', summary: item.summary || item.type || 'Artifact entry.', tags: ['artifact', ...(item.tags || [])] });
}
for (const item of readJson('src/data/roadmap.json') || []) {
  push({ title: item.title, type: 'roadmap', href: '#roadmap', summary: `${item.summary || ''} ${item.nextStep || ''}`.trim(), tags: ['roadmap', item.status, item.priority, ...(item.tags || [])].filter(Boolean) });
}

const planRoot = '.hermes/plans';
if (fs.existsSync(planRoot)) {
  for (const file of fs.readdirSync(planRoot).filter((name) => name.endsWith('.md')).sort()) {
    const text = fs.readFileSync(path.join(planRoot, file), 'utf8');
    const title = text.match(/^#\s+(.+)$/m)?.[1] || file;
    push({ title, type: 'plan', href: '#proof', summary: text.replace(/[#`*_>-]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 220), tags: ['plan', 'next-step'] });
  }
}

const seen = new Set();
const clean = entries.filter((entry) => {
  const key = `${entry.type}:${entry.title}`.toLowerCase();
  if (seen.has(key) || !entry.title || !entry.type || !entry.summary) return false;
  seen.add(key);
  entry.tags = [...new Set(entry.tags.map((tag) => tag.toLowerCase().replace(/[^a-z0-9-]+/g, '-')).filter(Boolean))].slice(0, 8);
  return true;
});

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, `${JSON.stringify(clean, null, 2)}\n`);
console.log(`search index built (${clean.length} entries)`);
