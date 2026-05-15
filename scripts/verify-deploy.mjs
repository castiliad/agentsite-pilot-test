#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const liveUrl = process.env.LIVE_URL;
const expectText = process.env.EXPECT_TEXT;
const repo = process.env.REPO;
const workflow = process.env.WORKFLOW || 'deploy.yml';
const branch = process.env.BRANCH || 'main';
const timeoutMs = Number(process.env.VERIFY_TIMEOUT_MS || 20000);

function usage() {
  console.error(`Usage:
  LIVE_URL="https://owner.github.io/repo/" EXPECT_TEXT="stable visible text" npm run verify:deploy

Optional GitHub Actions deploy check when GitHub CLI is installed/authenticated:
  REPO="owner/repo" WORKFLOW="deploy.yml" BRANCH="main" npm run verify:deploy

Environment:
  LIVE_URL             Required. Live page URL to fetch.
  EXPECT_TEXT          Required. Text that must appear in the live HTML.
  REPO                 Optional. GitHub repo in owner/name form for gh run verification.
  WORKFLOW             Optional. Workflow file/name. Defaults to deploy.yml.
  BRANCH               Optional. Branch for latest run lookup. Defaults to main.
  VERIFY_TIMEOUT_MS    Optional. Fetch timeout. Defaults to 20000.
`);
}

function fail(message) {
  console.error(`verify-deploy failed: ${message}`);
  process.exit(1);
}

function commandExists(command) {
  try {
    execFileSync('which', [command], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

async function verifyLiveContent() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(liveUrl, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'agentsite-verify-deploy/0.1' }
    });

    if (!response.ok) {
      fail(`LIVE_URL returned HTTP ${response.status} ${response.statusText}`);
    }

    const html = await response.text();
    if (!html.includes(expectText)) {
      fail(`EXPECT_TEXT was not found in live HTML: ${JSON.stringify(expectText)}`);
    }

    console.log(`live content ok: ${liveUrl} contains ${JSON.stringify(expectText)} (${html.length} bytes)`);
  } catch (error) {
    fail(`could not fetch LIVE_URL: ${error.message}`);
  } finally {
    clearTimeout(timer);
  }
}

function verifyLatestGhRun() {
  if (!repo) {
    console.log('github actions check skipped: REPO not set');
    return;
  }

  if (!commandExists('gh')) {
    console.log('github actions check skipped: gh CLI not found');
    return;
  }

  let output;
  try {
    output = execFileSync('gh', [
      'run', 'list',
      '--repo', repo,
      '--workflow', workflow,
      '--branch', branch,
      '--limit', '1',
      '--json', 'databaseId,status,conclusion,url,headSha,createdAt'
    ], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  } catch (error) {
    fail(`gh run lookup failed for ${repo}/${workflow}: ${error.stderr?.toString().trim() || error.message}`);
  }

  let runs;
  try {
    runs = JSON.parse(output);
  } catch (error) {
    fail(`could not parse gh JSON output: ${error.message}`);
  }

  if (!Array.isArray(runs) || runs.length === 0) {
    fail(`no GitHub Actions runs found for ${repo}, workflow ${workflow}, branch ${branch}`);
  }

  const run = runs[0];
  if (run.status !== 'completed' || run.conclusion !== 'success') {
    fail(`latest deploy run is not successful: status=${run.status}, conclusion=${run.conclusion}, url=${run.url}`);
  }

  console.log(`github actions ok: ${run.url} (${run.headSha}, ${run.createdAt})`);
}

if (!liveUrl || !expectText) {
  usage();
  process.exit(2);
}

await verifyLiveContent();
verifyLatestGhRun();
console.log('verify-deploy passed');
