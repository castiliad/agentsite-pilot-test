import fs from 'node:fs';

const required = [
  'AGENTS.md',
  '.agent/site.contract.yaml',
  '.agent/brand.contract.yaml',
  '.agent/payment.contract.yaml',
  '.agent/runbooks/deploy.md',
  '.agent/runbooks/feature-request.md',
  '.agent/recipes/README.md',
  '.agent/recipes/product-cockpit/recipe.yaml',
  '.agent/recipes/product-cockpit/README.md',
  '.agent/recipes/product-cockpit/acceptance.md',
  '.agent/recipes/copy-evidence-strip/recipe.yaml',
  '.agent/recipes/copy-evidence-strip/README.md',
  '.agent/recipes/copy-evidence-strip/acceptance.md',
  '.agent/recipes/editorial-ledger/recipe.yaml',
  '.agent/recipes/editorial-ledger/README.md',
  '.agent/recipes/editorial-ledger/acceptance.md',
  '.agent/recipes/artifact-gallery/recipe.yaml',
  '.agent/recipes/artifact-gallery/README.md',
  '.agent/recipes/artifact-gallery/acceptance.md',
  '.hermes/plans/initial-site-build.md'
];

const missing = required.filter((path) => !fs.existsSync(path));
if (missing.length) {
  console.error(`Missing required contract files:\n${missing.join('\n')}`);
  process.exit(1);
}

const payment = fs.readFileSync('.agent/payment.contract.yaml', 'utf8');
if (!/mode:\s*disabled/.test(payment) || !/no-payment/.test(payment)) {
  console.error('Payment contract must stay in disabled/no-payment mode.');
  process.exit(1);
}

console.log(`contract check passed (${required.length} files, payment disabled)`);
