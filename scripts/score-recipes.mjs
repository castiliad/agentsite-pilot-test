#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const registryDir = path.resolve('.agent/recipes');
const args = process.argv.slice(2);
const json = args.includes('--json');
const onlyId = valueAfter('--recipe') || valueAfter('--id');
const failBelowThreshold = args.includes('--fail-below-threshold');

if (!fs.existsSync(registryDir)) {
  console.error('Recipe registry not found: .agent/recipes');
  process.exit(1);
}

const recipeDirs = fs.readdirSync(registryDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((id) => !onlyId || id === onlyId)
  .sort();

if (!recipeDirs.length) {
  console.error(onlyId ? `Recipe not found: ${onlyId}` : 'No recipes found.');
  process.exit(1);
}

const results = recipeDirs.map(scoreRecipe);
const failed = results.filter((result) => result.score < result.passThreshold || result.errors.length);

if (json) {
  console.log(JSON.stringify(results, null, 2));
} else {
  for (const result of results) {
    const status = result.errors.length ? 'invalid' : result.score >= result.passThreshold ? 'pass' : 'review';
    console.log(`${result.id}: ${result.score}/${result.maxScore} (${status}, threshold ${result.passThreshold})`);
    for (const item of result.items) {
      const mark = item.passed ? '✓' : '•';
      console.log(`  ${mark} ${item.label}: ${item.points}/${item.weight}`);
      if (item.note) console.log(`    ${item.note}`);
    }
    for (const error of result.errors) console.log(`  ✕ ${error}`);
  }
}

if (failBelowThreshold && failed.length) process.exit(1);

function scoreRecipe(id) {
  const dir = path.join(registryDir, id);
  const yamlPath = path.join(dir, 'recipe.yaml');
  const readmePath = path.join(dir, 'README.md');
  const acceptancePath = path.join(dir, 'acceptance.md');
  const errors = [];
  const yaml = fs.existsSync(yamlPath) ? fs.readFileSync(yamlPath, 'utf8') : '';
  if (!yaml) errors.push('missing recipe.yaml');

  const criteria = parseCriteria(yaml);
  const criteriaWeight = criteria.reduce((sum, item) => sum + item.weight, 0);
  const passThreshold = numberScalar(yaml, 'pass_threshold') || 80;
  const checks = [
    {
      label: 'metadata',
      weight: 20,
      passed: requiredScalars(yaml, ['id', 'name', 'version', 'status', 'kind', 'summary', 'visual_preset']).length === 0,
      note: missingNote('missing metadata fields', requiredScalars(yaml, ['id', 'name', 'version', 'status', 'kind', 'summary', 'visual_preset']))
    },
    {
      label: 'directory id matches recipe id',
      weight: 10,
      passed: scalar(yaml, 'id') === id,
      note: scalar(yaml, 'id') ? `recipe.yaml id: ${scalar(yaml, 'id')}` : 'missing id'
    },
    {
      label: 'human docs',
      weight: 15,
      passed: fs.existsSync(readmePath) && fs.existsSync(acceptancePath),
      note: [!fs.existsSync(readmePath) && 'missing README.md', !fs.existsSync(acceptancePath) && 'missing acceptance.md'].filter(Boolean).join('; ')
    },
    {
      label: 'static safety rules',
      weight: 20,
      passed: /static_safety:\s*\n/.test(yaml) && /forbidden:\s*\n/.test(yaml) && /fake metrics|fake customers|unsupported guarantees/i.test(yaml),
      note: 'requires explicit static_safety and forbidden guidance'
    },
    {
      label: 'composition inputs and sections',
      weight: 15,
      passed: /inputs:\s*\n/.test(yaml) && /sections:\s*\n/.test(yaml),
      note: 'requires inputs and sections blocks'
    },
    {
      label: 'weighted scoring rubric',
      weight: 20,
      passed: criteria.length > 0 && criteriaWeight === 100,
      note: `criteria: ${criteria.length}, total weight: ${criteriaWeight}`
    }
  ];

  const items = checks.map((check) => ({
    ...check,
    points: check.passed ? check.weight : 0
  }));
  const score = items.reduce((sum, item) => sum + item.points, 0);
  return { id, score, maxScore: 100, passThreshold, criteriaWeight, items, errors };
}

function parseCriteria(text) {
  const weights = [...text.matchAll(/^\s+-\s+id:\s*[^\n]+\n(?:\s+[^\n]+\n)*?\s+weight:\s*(\d+)/gm)];
  return weights.map((match) => ({ weight: Number(match[1]) })).filter((item) => Number.isFinite(item.weight));
}

function requiredScalars(text, keys) {
  return keys.filter((key) => !scalar(text, key));
}

function missingNote(prefix, missing) {
  return missing.length ? `${prefix}: ${missing.join(', ')}` : '';
}

function scalar(text, key) {
  const block = text.match(new RegExp(`^${escapeRegExp(key)}:\\s*>\\s*\\n((?:\\s+[^\\n]+\\n?)+)`, 'm'));
  if (block) return block[1].split('\n').map((line) => line.trim()).filter(Boolean).join(' ');
  const match = text.match(new RegExp(`^${escapeRegExp(key)}:\\s*(.+?)\\s*$`, 'm'));
  if (!match) return '';
  return match[1].replace(/^['"]|['"]$/g, '').trim();
}

function numberScalar(text, key) {
  const value = Number(scalar(text, key));
  return Number.isFinite(value) ? value : null;
}

function valueAfter(flag) {
  const index = args.indexOf(flag);
  if (index === -1) return '';
  return args[index + 1] || '';
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
