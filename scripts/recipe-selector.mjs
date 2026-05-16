export const PRODUCT_COCKPIT_RECIPE = 'product-cockpit';
export const PRODUCT_COCKPIT_PRESET = 'cockpit-dark';
export const EDITORIAL_LEDGER_RECIPE = 'editorial-ledger';
export const EDITORIAL_LEDGER_PRESET = 'editorial-light';
export const COPY_EVIDENCE_STRIP_RECIPE = 'copy-evidence-strip';
export const COPY_EVIDENCE_STRIP_PRESET = 'evidence-strip';
export const ARTIFACT_GALLERY_RECIPE = 'artifact-gallery';
export const ARTIFACT_GALLERY_PRESET = 'artifact-gallery';
export const ROADMAP_BOARD_RECIPE = 'roadmap-board';
export const ROADMAP_BOARD_PRESET = 'roadmap-board';
export const SEARCH_INDEX_RECIPE = 'search-index';
export const SEARCH_INDEX_PRESET = 'search-index';
export const AGENTSITE_ATLAS_RECIPE = 'agentsite-atlas';
export const AGENTSITE_ATLAS_PRESET = 'agentsite-atlas';

const PRODUCT_COCKPIT_PATTERNS = [
  ['product', /\bproducts?\b/i],
  ['service', /\bservices?\b/i],
  ['pilot', /\bpilots?\b/i],
  ['agent', /\bagents?\b|\bagentic\b/i],
  ['workflow', /\bworkflows?\b/i],
  ['AI', /\bai\b|artificial intelligence/i],
  ['tool', /\btools?\b/i],
  ['dashboard', /\bdashboards?\b|\bcockpits?\b|\bcontrol plane\b/i],
  ['review', /\breviews?\b|\breviewer\b|\bevaluation\b|\bevaluate\b/i],
  ['QA', /\bqa\b|quality assurance/i],
  ['deploy', /\bdeploy(?:s|ed|ment)?\b|deployment/i],
  ['operators', /\boperators?\b|\boperations?\b/i],
  ['founders', /\bfounders?\b/i],
  ['B2B', /\bb2b\b/i],
  ['dev/technical', /\bdevs?\b|\bdevelopers?\b|\btechnical\b|\bengineering\b|\bengineers?\b/i]
];

const EDITORIAL_LEDGER_PATTERNS = [
  ['editorial', /\beditorial\b|\bmagazine\b|\bessay\b/i],
  ['ledger', /\bledger\b|\breceipts?\b|\bprovenance\b/i],
  ['memo', /\bmemo\b|\bbriefing\b|\bcase file\b|\bcasefile\b/i],
  ['narrative', /\bnarrative\b|\bstory\b|\bexplainer\b/i],
  ['trust/copy', /\btrustworthy\b|\bcredibility\b|\bclaims?\b|\bcopy\b|\bpositioning\b/i],
  ['artifact documentation', /\bartifacts?\b|\bdocs?\b|\bdocumentation\b|\bevidence\b|\bproof\b/i]
];

const COPY_EVIDENCE_PATTERNS = [
  ['proof', /\bproof\b|\bevidence\b/i],
  ['claims', /\bclaims?\b|\bclaim-backed\b/i],
  ['trust', /\btrust\b|\bcredible\b|\bcredibility\b/i],
  ['artifacts', /\bartifacts?\b|\breceipts?\b|\bdocs?\b|\bdocumentation\b/i],
  ['screenshots', /\bscreenshots?\b|\bvisual qa\b/i],
  ['contracts/runbooks', /\bcontracts?\b|\brunbooks?\b|\bqa scripts?\b/i],
  ['copy quality', /\bcopy\b|\bmarketing\b|\bpositioning\b|\blanding page\b/i],
  ['portfolio/case context', /\bportfolio\b|\bcase\b|\bshowcase\b/i]
];


const ARTIFACT_GALLERY_PATTERNS = [
  ['artifact gallery', /artifact gallery|artifacts?/i],
  ['search/filter', /search(?:able)?|filter(?:able|ing)?|faceted/i],
  ['catalog/directory', /catalog|directory|library|index/i],
  ['proof browser', /proof browser|evidence browser|receipts?/i],
  ['screenshots/audits', /screenshots?|audits?|visual qa/i],
  ['plans/deploys', /plans?|deploy(?:s|ed|ment)?|runbooks?/i]
];


const AGENTSITE_ATLAS_PATTERNS = [
  ['atlas/directory', /\batlas\b|\bdirectory\b|\bproof sites?\b/i],
  ['generated sites', /\bgenerated sites?\b|\bsite map\b|\bsystem map\b/i],
  ['recipe coverage', /\bcoverage\b|\brecipe coverage\b|\bproof-site\b/i],
  ['deploy evidence', /\bdeploy evidence\b|\blive links?\b|\brepos?\b/i]
];

const SEARCH_INDEX_PATTERNS = [
  ['search/index', /\bsearch\b|\bindex\b|\bcommand palette\b/i],
  ['queryable', /\bqueryable\b|\bdiscoverable\b|\bsite brain\b/i],
  ['static intelligence', /\bstatic intelligence\b|\bintelligence pack\b/i],
  ['contracts/recipes/plans', /\bcontracts?\b|\brecipes?\b|\bplans?\b|\bartifacts?\b/i]
];

const ROADMAP_BOARD_PATTERNS = [
  ['roadmap board', /roadmap|board|kanban/i],
  ['next steps', /next steps?|improvement queue|backlog/i],
  ['status/priority', /status|priority|priorities/i],
  ['local-first', /local-first|localStorage|browser-local/i],
  ['agent maintenance', /maintain(?:ed|er|ers|ance)?|agents?/i]
];

const SECTION_PATTERNS = [
  ['proof section', /\bproof\b|\bevidence\b/i],
  ['workflow section', /\bworkflows?\b|\bprocess\b/i],
  ['boundaries section', /\bboundar(?:y|ies)\b|\bguardrails?\b|\bconstraints?\b/i]
];

export function recommendRecipes(input = {}) {
  const textParts = [
    input.brief,
    input.description,
    ...(Array.isArray(input.audience) ? input.audience : [])
  ];
  const haystack = textParts.filter((item) => item !== undefined && item !== null).map(String).join('\n');
  const productReasons = [];
  const editorialReasons = [];
  const evidenceReasons = [];
  const artifactReasons = [];
  const roadmapReasons = [];
  const searchIndexReasons = [];
  const atlasReasons = [];

  collectMatches(haystack, PRODUCT_COCKPIT_PATTERNS, productReasons);
  collectMatches(haystack, EDITORIAL_LEDGER_PATTERNS, editorialReasons);
  collectMatches(haystack, COPY_EVIDENCE_PATTERNS, evidenceReasons);
  collectMatches(haystack, ARTIFACT_GALLERY_PATTERNS, artifactReasons);
  collectMatches(haystack, ROADMAP_BOARD_PATTERNS, roadmapReasons);
  collectMatches(haystack, SEARCH_INDEX_PATTERNS, searchIndexReasons);
  collectMatches(haystack, AGENTSITE_ATLAS_PATTERNS, atlasReasons);

  const proofArtifacts = Array.isArray(input.proofArtifacts) ? input.proofArtifacts : [];
  if (proofArtifacts.length >= 2) {
    evidenceReasons.push(`proofArtifacts provided (${proofArtifacts.length})`);
    artifactReasons.push(`proofArtifacts provided (${proofArtifacts.length})`);
    editorialReasons.push(`proofArtifacts provided (${proofArtifacts.length})`);
  }
  if (proofArtifacts.length > 0) productReasons.push(`proofArtifacts provided (${proofArtifacts.length})`);
  if (/roadmap|next step|improvement|local-first/i.test(haystack)) roadmapReasons.push('roadmap/local-first language detected');

  const sections = Array.isArray(input.sections) ? input.sections : [];
  for (const section of sections) {
    const sectionText = [section?.id, section?.title, section?.navLabel, section?.body]
      .filter((item) => item !== undefined && item !== null)
      .map(String)
      .join(' ');
    for (const [label, pattern] of SECTION_PATTERNS) {
      if (pattern.test(sectionText)) productReasons.push(`${label} detected`);
      if (/proof|evidence/i.test(label) && pattern.test(sectionText)) {
        evidenceReasons.push(`${label} detected`);
        editorialReasons.push(`${label} detected`);
      }
    }
  }

  const selectedRecipes = [];
  const reasons = [];
  const productUnique = [...new Set(productReasons)];
  const editorialUnique = [...new Set(editorialReasons)];
  const evidenceUnique = [...new Set(evidenceReasons)];
  const artifactUnique = [...new Set(artifactReasons)];
  const roadmapUnique = [...new Set(roadmapReasons)];
  const searchIndexUnique = [...new Set(searchIndexReasons)];
  const atlasUnique = [...new Set(atlasReasons)];

  // Prefer one full-page archetype. Editorial-ledger wins when narrative/provenance/claim-ledger
  // signals dominate; product-cockpit wins for operational/tool/control-plane signals.
  const strongEditorial = /\b(editorial|memo|ledger|provenance|briefing|case file|casefile)\b/i.test(haystack);
  const useEditorial = editorialUnique.length > 0 && (strongEditorial || editorialUnique.length >= productUnique.length);
  const useProduct = !useEditorial && productUnique.length > 0;

  if (useEditorial) {
    selectedRecipes.push(EDITORIAL_LEDGER_RECIPE);
    reasons.push(...editorialUnique.map((reason) => `${EDITORIAL_LEDGER_RECIPE}: ${reason}`));
  } else if (useProduct) {
    selectedRecipes.push(PRODUCT_COCKPIT_RECIPE);
    reasons.push(...productUnique.map((reason) => `${PRODUCT_COCKPIT_RECIPE}: ${reason}`));
  }

  if (evidenceUnique.length > 0) {
    selectedRecipes.push(COPY_EVIDENCE_STRIP_RECIPE);
    reasons.push(...evidenceUnique.map((reason) => `${COPY_EVIDENCE_STRIP_RECIPE}: ${reason}`));
  }

  if (artifactUnique.length > 0) {
    selectedRecipes.push(ARTIFACT_GALLERY_RECIPE);
    reasons.push(...artifactUnique.map((reason) => `${ARTIFACT_GALLERY_RECIPE}: ${reason}`));
  }

  if (roadmapUnique.length > 0) {
    selectedRecipes.push(ROADMAP_BOARD_RECIPE);
    reasons.push(...roadmapUnique.map((reason) => `${ROADMAP_BOARD_RECIPE}: ${reason}`));
  }

  if (searchIndexUnique.length > 0) {
    selectedRecipes.push(SEARCH_INDEX_RECIPE);
    reasons.push(...searchIndexUnique.map((reason) => `${SEARCH_INDEX_RECIPE}: ${reason}`));
  }

  if (atlasUnique.length > 0) {
    selectedRecipes.push(AGENTSITE_ATLAS_RECIPE);
    reasons.push(...atlasUnique.map((reason) => `${AGENTSITE_ATLAS_RECIPE}: ${reason}`));
  }

  const uniqueReasons = [...new Set(reasons)];
  const selected = selectedRecipes.length > 0;
  const archetype = selectedRecipes.includes(EDITORIAL_LEDGER_RECIPE)
    ? 'editorial-ledger'
    : selectedRecipes.includes(PRODUCT_COCKPIT_RECIPE)
      ? 'product-cockpit'
      : '';
  const visualPreset = selectedRecipes.includes(EDITORIAL_LEDGER_RECIPE)
    ? EDITORIAL_LEDGER_PRESET
    : selectedRecipes.includes(PRODUCT_COCKPIT_RECIPE)
      ? PRODUCT_COCKPIT_PRESET
      : selectedRecipes.includes(COPY_EVIDENCE_STRIP_RECIPE)
        ? COPY_EVIDENCE_STRIP_PRESET
        : selectedRecipes.includes(ARTIFACT_GALLERY_RECIPE)
          ? ARTIFACT_GALLERY_PRESET
          : selectedRecipes.includes(ROADMAP_BOARD_RECIPE)
            ? ROADMAP_BOARD_PRESET
            : selectedRecipes.includes(SEARCH_INDEX_RECIPE)
              ? SEARCH_INDEX_PRESET
              : selectedRecipes.includes(AGENTSITE_ATLAS_RECIPE)
                ? AGENTSITE_ATLAS_PRESET
                : '';
  return {
    selectedRecipes,
    archetype,
    visualPreset,
    recommendation: selected ? 'select' : 'none',
    score: uniqueReasons.length,
    reasons: uniqueReasons,
    explanation: selected
      ? `Auto-selected ${selectedRecipes.join(', ')} because ${joinReasons(uniqueReasons)}.`
      : 'No auto recipe selected; no recipe heuristic signals matched.'
  };
}

function collectMatches(text, patterns, out) {
  for (const [label, pattern] of patterns) {
    if (pattern.test(text)) out.push(`matched ${label} language`);
  }
}

export function joinReasons(reasons) {
  if (!Array.isArray(reasons) || reasons.length === 0) return 'no matching signals were found';
  if (reasons.length === 1) return reasons[0];
  if (reasons.length === 2) return `${reasons[0]} and ${reasons[1]}`;
  return `${reasons.slice(0, -1).join(', ')}, and ${reasons.at(-1)}`;
}
