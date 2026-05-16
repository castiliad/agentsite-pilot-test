#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { recommendRecipes } from './recipe-selector.mjs';

const args = parseArgs(process.argv.slice(2));
if (args.help || args.h) usage(0);

const config = args.config ? loadConfig(args.config) : {};
const inline = {
  brief: args.brief,
  description: args.description,
  audience: args.audience ? splitList(args.audience) : undefined
};
const input = { ...config, ...withoutMeta(inline) };
const result = recommendRecipes(input);

if (args.json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`recommendation: ${result.recommendation}`);
  console.log(`selectedRecipes: ${result.selectedRecipes.length ? result.selectedRecipes.join(', ') : 'none'}`);
  console.log(`visualPreset: ${result.visualPreset || 'none'}`);
  console.log(`score: ${result.score}`);
  console.log('reasons:');
  if (result.reasons.length) {
    for (const reason of result.reasons) console.log(`- ${reason}`);
  } else {
    console.log('- no product-cockpit heuristic signals matched');
  }
  console.log(`explanation: ${result.explanation}`);
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) fail(`Unexpected positional argument: ${token}`);
    const [rawKey, inline] = token.slice(2).split('=');
    const key = rawKey.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
    if (['json', 'help', 'h'].includes(rawKey)) {
      parsed[key] = inline === undefined ? true : inline !== 'false';
      continue;
    }
    const value = inline !== undefined ? inline : argv[++i];
    if (value === undefined || value.startsWith('--')) fail(`Missing value for --${rawKey}`);
    parsed[key] = value;
  }
  return parsed;
}

function loadConfig(configPath) {
  const resolved = path.resolve(String(configPath));
  let text;
  try { text = fs.readFileSync(resolved, 'utf8'); }
  catch (error) { fail(`Could not read --config ${resolved}: ${error.message}`); }
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) fail(`Config JSON must be an object: ${resolved}`);
    return parsed;
  } catch (error) {
    fail(`Invalid config JSON at ${resolved}: ${error.message}`);
  }
}

function withoutMeta(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
}

function splitList(value) {
  return String(value).split(',').map((item) => item.trim()).filter(Boolean);
}

function usage(code) {
  console.log(`Usage:\n  npm run recommend:recipes -- --config examples/auto-recipes.config.json [--json]\n  npm run recommend:recipes -- --brief "AI workflow dashboard for B2B operators" --audience "founders,technical teams"\n\nScores deterministic product-cockpit heuristic signals. It does not write files.`);
  process.exit(code);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
