#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const registryDir = path.resolve('.agent/recipes');
const args = new Set(process.argv.slice(2));
const json = args.has('--json');

if (!fs.existsSync(registryDir)) {
  console.error('Recipe registry not found: .agent/recipes');
  process.exit(1);
}

const recipes = fs.readdirSync(registryDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => readRecipe(entry.name))
  .sort((a, b) => a.id.localeCompare(b.id));

if (json) {
  console.log(JSON.stringify(recipes, null, 2));
} else if (!recipes.length) {
  console.log('No recipes found in .agent/recipes.');
} else {
  console.log(`Found ${recipes.length} recipe${recipes.length === 1 ? '' : 's'}:\n`);
  for (const recipe of recipes) {
    console.log(`- ${recipe.id} (${recipe.kind || 'unclassified'}, ${recipe.status || 'unknown'}, ${recipe.version || 'unversioned'})`);
    console.log(`  ${recipe.name || recipe.id}`);
    if (recipe.summary) console.log(`  ${recipe.summary}`);
    if (recipe.visualPreset) console.log(`  visualPreset: ${recipe.visualPreset}`);
    console.log(`  files: ${recipe.files.join(', ')}`);
  }
}

function readRecipe(id) {
  const dir = path.join(registryDir, id);
  const yamlPath = path.join(dir, 'recipe.yaml');
  if (!fs.existsSync(yamlPath)) {
    return { id, files: fs.readdirSync(dir).sort(), error: 'missing recipe.yaml' };
  }
  const yaml = fs.readFileSync(yamlPath, 'utf8');
  return {
    id: scalar(yaml, 'id') || id,
    name: scalar(yaml, 'name'),
    version: scalar(yaml, 'version'),
    status: scalar(yaml, 'status'),
    summary: scalar(yaml, 'summary'),
    kind: scalar(yaml, 'kind'),
    visualPreset: scalar(yaml, 'visual_preset'),
    passThreshold: numberScalar(yaml, 'pass_threshold'),
    files: fs.readdirSync(dir).sort()
  };
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

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
