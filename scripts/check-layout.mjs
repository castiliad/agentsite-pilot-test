import fs from 'node:fs';

const page = 'src/pages/index.astro';
if (!fs.existsSync(page)) { console.log('layout check skipped (src/pages/index.astro not present)'); process.exit(0); }
const text = fs.readFileSync(page, 'utf8');
const failures = [];
const hasPrimaryLayout = text.includes('secondary-modules') || text.includes('data-primary-surface') || text.includes('primary-surface-layout');
if (hasPrimaryLayout) {
  const primaryMatch = text.match(/data-primary-surface=\"([^\"]+)\"|data-primary-surface="([^"]+)"/);
  const primary = primaryMatch?.[1] || primaryMatch?.[2] || '';
  if (!primary) failures.push('primary surface layout must record data-primary-surface');
  const primaryComponents = {
    briefing: 'ChiefOfStaffBriefing',
    requests: 'FeatureRequestInbox',
    runs: 'AgentRunLedger',
    atlas: 'AgentSiteAtlas',
    search: 'SearchIndex',
    roadmap: 'RoadmapBoard',
    artifacts: 'ArtifactGallery'
  };
  const primaryAnchor = primary ? `id=\"${primary}\"` : '';
  const anchorIndex = primaryAnchor ? text.indexOf(primaryAnchor) : -1;
  const componentIndex = primary && primaryComponents[primary] ? text.indexOf(`<${primaryComponents[primary]}`) : -1;
  const primaryIndex = anchorIndex >= 0 ? anchorIndex : componentIndex;
  const secondaryIndex = text.indexOf('id="secondary-modules"') >= 0 ? text.indexOf('id="secondary-modules"') : text.indexOf('id=\"secondary-modules\"');
  const proofIndex = text.indexOf('id="proof"') >= 0 ? text.indexOf('id="proof"') : text.indexOf('id=\"proof\"');
  if (primaryIndex < 0) failures.push(`primary surface anchor not found: ${primary}`);
  if (secondaryIndex < 0) failures.push('secondary modules section not found');
  if (primaryIndex >= 0 && secondaryIndex >= 0 && primaryIndex > secondaryIndex) failures.push('primary surface must appear before secondary modules');
  if (secondaryIndex >= 0 && proofIndex >= 0 && secondaryIndex > proofIndex) failures.push('secondary modules should appear before generic proof sections');
  const detailCount = (text.match(/data-secondary-module/g) || []).length;
  if (detailCount < 1) failures.push('primary surface layout should wrap at least one secondary module');
}
console.log(hasPrimaryLayout ? 'layout check passed (primary surface layout)' : 'layout check passed (no primary surface layout selected)');
if (failures.length) { console.error(failures.join('\n')); process.exit(1); }
