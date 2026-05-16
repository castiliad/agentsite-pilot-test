export const PRODUCT_COCKPIT_RECIPE = 'product-cockpit';
export const PRODUCT_COCKPIT_PRESET = 'cockpit-dark';

const KEYWORD_PATTERNS = [
  ['product', /\bproducts?\b/i],
  ['service', /\bservices?\b/i],
  ['pilot', /\bpilots?\b/i],
  ['agent', /\bagents?\b|\bagentic\b/i],
  ['workflow', /\bworkflows?\b/i],
  ['AI', /\bai\b|artificial intelligence/i],
  ['tool', /\btools?\b/i],
  ['dashboard', /\bdashboards?\b|\bcockpits?\b/i],
  ['review', /\breviews?\b|\breviewer\b|\bevaluation\b|\bevaluate\b/i],
  ['proof', /\bproof\b|\bevidence\b/i],
  ['artifacts', /\bartifacts?\b/i],
  ['QA', /\bqa\b|quality assurance/i],
  ['deploy', /\bdeploy(?:s|ed|ment)?\b|deployment/i],
  ['consultants', /\bconsultants?\b/i],
  ['operators', /\boperators?\b|\boperations?\b/i],
  ['founders', /\bfounders?\b/i],
  ['B2B', /\bb2b\b/i],
  ['dev/technical', /\bdevs?\b|\bdevelopers?\b|\btechnical\b|\bengineering\b|\bengineers?\b/i]
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
  const reasons = [];

  for (const [label, pattern] of KEYWORD_PATTERNS) {
    if (pattern.test(haystack)) reasons.push(`matched ${label} language`);
  }

  const proofArtifacts = Array.isArray(input.proofArtifacts) ? input.proofArtifacts : [];
  if (proofArtifacts.length > 0) reasons.push(`proofArtifacts provided (${proofArtifacts.length})`);

  const sections = Array.isArray(input.sections) ? input.sections : [];
  for (const section of sections) {
    const sectionText = [section?.id, section?.title, section?.navLabel, section?.body]
      .filter((item) => item !== undefined && item !== null)
      .map(String)
      .join(' ');
    for (const [label, pattern] of SECTION_PATTERNS) {
      if (pattern.test(sectionText)) reasons.push(`${label} detected`);
    }
  }

  const uniqueReasons = [...new Set(reasons)];
  const score = uniqueReasons.length;
  const selected = score > 0;
  return {
    selectedRecipes: selected ? [PRODUCT_COCKPIT_RECIPE] : [],
    visualPreset: selected ? PRODUCT_COCKPIT_PRESET : '',
    recommendation: selected ? 'select' : 'none',
    score,
    reasons: uniqueReasons,
    explanation: selected
      ? `Auto-selected ${PRODUCT_COCKPIT_RECIPE} because ${joinReasons(uniqueReasons)}.`
      : 'No auto recipe selected; no product-cockpit heuristic signals matched.'
  };
}

export function joinReasons(reasons) {
  if (!Array.isArray(reasons) || reasons.length === 0) return 'no matching signals were found';
  if (reasons.length === 1) return reasons[0];
  if (reasons.length === 2) return `${reasons[0]} and ${reasons[1]}`;
  return `${reasons.slice(0, -1).join(', ')}, and ${reasons.at(-1)}`;
}
