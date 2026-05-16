#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'agentsite-divergence-'));
const cases = [
  {
    name: 'cockpit',
    args: ['--config', 'examples/product-cockpit.config.json', '--repo', 'divergence-cockpit', '--out', path.join(tmpRoot, 'cockpit'), '--force'],
    expected: ['cockpit-shell', 'cockpit-grid', 'product-cockpit recipe']
  },
  {
    name: 'editorial',
    args: ['--config', 'examples/editorial-ledger.config.json', '--repo', 'divergence-editorial', '--out', path.join(tmpRoot, 'editorial'), '--force'],
    expected: ['editorial-ledger', 'ledger-hero', 'editorial-ledger archetype']
  }
];

try {
  for (const item of cases) {
    run('node', ['scripts/create-agentsite.mjs', ...item.args], { cwd: root });
  }

  const signatures = cases.map((item) => {
    const dir = item.args[item.args.indexOf('--out') + 1];
    const index = fs.readFileSync(path.join(dir, 'src/pages/index.astro'), 'utf8');
    const css = fs.readFileSync(path.join(dir, 'src/styles/global.css'), 'utf8');
    const all = `${index}\n${css}`;
    const missing = item.expected.filter((needle) => !all.includes(needle));
    if (missing.length) fail(`${item.name} missing expected archetype markers: ${missing.join(', ')}`);
    return { name: item.name, tokens: signatureTokens(all) };
  });

  const similarity = jaccard(signatures[0].tokens, signatures[1].tokens);
  const maxAllowed = 0.56;
  if (similarity > maxAllowed) {
    fail(`visual divergence check failed: ${signatures[0].name} vs ${signatures[1].name} similarity ${similarity.toFixed(2)} > ${maxAllowed}`);
  }
  console.log(`visual divergence check passed (${signatures[0].name} vs ${signatures[1].name}: ${similarity.toFixed(2)} similarity)`);
} finally {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}

function signatureTokens(text) {
  const tokens = new Set();
  const patterns = [
    /#[0-9a-f]{3,8}\b/gi,
    /\b(?:radial-gradient|linear-gradient|Georgia|JetBrains|Inter|serif|monospace)\b/gi,
    /\b(?:cockpit|ledger|editorial|terminal|artifact|evidence|hero|panel|memo|claim|paper)\b/gi,
    /\.[a-z][a-z0-9-]+/gi,
    /grid-template-columns:\s*[^;]+/gi,
    /font-size:\s*clamp\([^;]+/gi
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) tokens.add(match[0].toLowerCase().replace(/\s+/g, ' '));
  }
  return tokens;
}

function jaccard(a, b) {
  const intersection = [...a].filter((item) => b.has(item)).length;
  const union = new Set([...a, ...b]).size;
  return union ? intersection / union : 1;
}

function run(command, args, options) {
  const result = spawnSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], ...options });
  if (result.status !== 0) fail(`Command failed: ${command} ${args.join(' ')}\n${result.stdout}\n${result.stderr}`.trim());
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
