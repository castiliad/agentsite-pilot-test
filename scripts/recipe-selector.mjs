export const PRODUCT_COCKPIT_RECIPE = 'product-cockpit';
export const PRODUCT_COCKPIT_PRESET = 'cockpit-dark';
export const COPY_EVIDENCE_STRIP_RECIPE = 'copy-evidence-strip';
export const COPY_EVIDENCE_STRIP_PRESET = 'evidence-strip';

const PRODUCT_COCKPIT_PATTERNS = [
  ['product', /\bproducts?\b/i],
  ['service', /\bservices?\b/i],
  ['pilot', /\bpilots?\b/i],
  ['agent', /\bagents?\b|\bagentic\b/i],
  ['workflow', /\bworkflows?\b/i],
  ['AI', /\bai\b|artificial intelligence/i],
  ['tool', /\btools?\b/i],
  ['dashboard', /\bdashboards?\b|\bcockpits?\b/i],
  ['review', /\breviews?\b|\breviewer\b|\bevaluation\b|\bevaluate\b/i],
  ['QA', /\bqa\b|quality assurance/i],
  ['deploy', /\bdeploy(?:s|ed|ment)?\b|deployment/i],
  ['consultants', /\bconsultants?\b/i],
  ['operators', /\boperators?\b|\boperations?\b/i],
  ['founders', /\bfounders?\b/i],
  ['B2B', /\bb2b\b/i],
  ['dev/technical', /\bdevs?\b|\bdevelopers?\b|\btechnical\b|\bengineering\b|\bengineers?\b/i]
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
  const evidenceReasons = [];

  for (const [label, pattern] of PRODUCT_COCKPIT_PATTERNS) {
    if (pattern.test(haystack)) productReasons.push(`matched ${label} language`);
  }
  for (const [label, pattern] of COPY_EVIDENCE_PATTERNS) {
    if (pattern.test(haystack)) evidenceReasons.push(`matched ${label} language`);
  }

  const proofArtifacts = Array.isArray(input.proofArtifacts) ? input.proofArtifacts : [];
  if (proofArtifacts.length >= 2) evidenceReasons.push(`proofArtifacts provided (${proofArtifacts.length})`);
  if (proofArtifacts.length > 0) productReasons.push(`proofArtifacts provided (${proofArtifacts.length})`);

  const sections = Array.isArray(input.sections) ? input.sections : [];
  for (const section of sections) {
    const sectionText = [section?.id, section?.title, section?.navLabel, section?.body]
      .filter((item) => item !== undefined && item !== null)
      .map(String)
      .join(' ');
    for (const [label, pattern] of SECTION_PATTERNS) {
      if (pattern.test(sectionText)) productReasons.push(`${label} detected`);
      if (/proof|evidence/i.test(label) && pattern.test(sectionText)) evidenceReasons.push(`${label} detected`);
    }
  }

  const selectedRecipes = [];
  const reasons = [];
  const productUnique = [...new Set(productReasons)];
  const evidenceUnique = [...new Set(evidenceReasons)];
  if (productUnique.length > 0) {
    selectedRecipes.push(PRODUCT_COCKPIT_RECIPE);
    reasons.push(...productUnique.map((reason) => `${PRODUCT_COCKPIT_RECIPE}: ${reason}`));
  }
  if (evidenceUnique.length > 0) {
    selectedRecipes.push(COPY_EVIDENCE_STRIP_RECIPE);
    reasons.push(...evidenceUnique.map((reason) => `${COPY_EVIDENCE_STRIP_RECIPE}: ${reason}`));
  }

  const uniqueReasons = [...new Set(reasons)];
  const selected = selectedRecipes.length > 0;
  return {
    selectedRecipes,
    visualPreset: selectedRecipes.includes(PRODUCT_COCKPIT_RECIPE) ? PRODUCT_COCKPIT_PRESET : selectedRecipes.includes(COPY_EVIDENCE_STRIP_RECIPE) ? COPY_EVIDENCE_STRIP_PRESET : '',
    recommendation: selected ? 'select' : 'none',
    score: uniqueReasons.length,
    reasons: uniqueReasons,
    explanation: selected
      ? `Auto-selected ${selectedRecipes.join(', ')} because ${joinReasons(uniqueReasons)}.`
      : 'No auto recipe selected; no recipe heuristic signals matched.'
  };
}

export function joinReasons(reasons) {
  if (!Array.isArray(reasons) || reasons.length === 0) return 'no matching signals were found';
  if (reasons.length === 1) return reasons[0];
  if (reasons.length === 2) return `${reasons[0]} and ${reasons[1]}`;
  return `${reasons.slice(0, -1).join(', ')}, and ${reasons.at(-1)}`;
}
