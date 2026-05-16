#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import net from 'node:net';
import { chromium } from '@playwright/test';

const root = process.cwd();
const host = '127.0.0.1';
const requestedPort = Number(process.env.VISUAL_QA_PORT || 4327);
const port = await findAvailablePort(requestedPort);
const basePath = normalizeBasePath(readAstroBase());
const startUrl = `http://${host}:${port}${basePath}`;
const screenshotDir = process.env.VISUAL_QA_SCREENSHOT_DIR || path.join('.agent', 'audits', 'screenshots');
const viewports = [
  { name: 'desktop', width: 1440, height: 1100 },
  { name: 'mobile', width: 390, height: 844 }
];

fs.mkdirSync(screenshotDir, { recursive: true });

await runCommand('npm', ['run', 'build']);
const server = spawn(process.platform === 'win32' ? 'npx.cmd' : 'npx', ['astro', 'preview', '--host', host, '--port', String(port)], {
  cwd: root,
  stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, NO_COLOR: '1' }
});

let serverOutput = '';
server.stdout.on('data', (chunk) => { serverOutput += chunk.toString(); });
server.stderr.on('data', (chunk) => { serverOutput += chunk.toString(); });

try {
  await waitForServer(startUrl);
  const browser = await chromium.launch();
  const failures = [];
  const screenshots = [];

  try {
    for (const viewport of viewports) {
      const result = await auditViewport(browser, viewport);
      failures.push(...result.failures);
      screenshots.push(result.screenshotPath);
    }
  } finally {
    await browser.close();
  }

  if (failures.length) {
    console.error('visual QA failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    console.error(`screenshots written to ${screenshotDir}`);
    process.exitCode = 1;
  } else {
    console.log(`visual QA passed (${viewports.length} viewports)`);
    for (const screenshot of screenshots) console.log(`screenshot: ${screenshot}`);
  }
} finally {
  await stopServer(server);
}

process.exit(process.exitCode || 0);

async function auditViewport(browser, viewport) {
  const failures = [];
  const page = await browser.newPage({ viewport: { width: viewport.width, height: viewport.height }, deviceScaleFactor: 1 });
  const consoleFailures = [];
  const pageFailures = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleFailures.push(message.text());
  });
  page.on('pageerror', (error) => pageFailures.push(error.message));

  await page.goto(startUrl, { waitUntil: 'networkidle' });
  await page.emulateMedia({ reducedMotion: 'reduce' });

  const screenshotPath = path.join(screenshotDir, `${viewport.name}.png`);
  await page.screenshot({ path: screenshotPath, fullPage: true });

  if (consoleFailures.length) failures.push(`${viewport.name}: console errors: ${consoleFailures.join(' | ')}`);
  if (pageFailures.length) failures.push(`${viewport.name}: page errors: ${pageFailures.join(' | ')}`);

  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return {
      viewport: window.innerWidth,
      documentScrollWidth: doc.scrollWidth,
      bodyScrollWidth: body ? body.scrollWidth : 0,
      offending: Array.from(document.querySelectorAll('body *'))
        .map((element) => {
          const rect = element.getBoundingClientRect();
          return { tag: element.tagName.toLowerCase(), className: element.className || '', id: element.id || '', right: Math.ceil(rect.right), left: Math.floor(rect.left), width: Math.ceil(rect.width) };
        })
        .filter((item) => item.width > 0 && (item.right > window.innerWidth + 2 || item.left < -2))
        .slice(0, 5)
    };
  });
  if (overflow.documentScrollWidth > overflow.viewport + 2 || overflow.bodyScrollWidth > overflow.viewport + 2) {
    failures.push(`${viewport.name}: horizontal overflow (viewport ${overflow.viewport}, document ${overflow.documentScrollWidth}, body ${overflow.bodyScrollWidth}, offenders ${JSON.stringify(overflow.offending)})`);
  }

  await expectVisible(page, 'h1', `${viewport.name}: hero h1`, failures, { minWidth: 120, minHeight: 30 });
  await expectVisible(page, 'nav[aria-label="Primary navigation"], nav.nav, nav', `${viewport.name}: primary nav`, failures, { minWidth: 160, minHeight: 24 });
  await expectVisible(page, 'a.button.primary, .hero-actions a:first-child, a[href="#cta"]', `${viewport.name}: primary CTA`, failures, { minWidth: 80, minHeight: 30 });

  const navText = await page.locator('nav').first().innerText().catch(() => '');
  if (/\.\.\.|…/.test(navText)) failures.push(`${viewport.name}: visible nav text contains ellipsis: ${JSON.stringify(navText)}`);

  const anchorFailures = await checkInternalAnchors(page, viewport.name);
  failures.push(...anchorFailures);

  const artifactFailures = await checkArtifactGallery(page, viewport.name);
  failures.push(...artifactFailures);

  const roadmapFailures = await checkRoadmapBoard(page, viewport.name);
  failures.push(...roadmapFailures);

  await page.close();
  return { failures, screenshotPath };
}

async function expectVisible(page, selector, label, failures, minimum) {
  const locator = page.locator(selector).first();
  const count = await locator.count();
  if (!count) {
    failures.push(`${label} not found (${selector})`);
    return;
  }
  const box = await locator.boundingBox();
  const visible = await locator.isVisible().catch(() => false);
  if (!visible || !box || box.width < minimum.minWidth || box.height < minimum.minHeight) {
    failures.push(`${label} not visible enough (${selector}, box ${JSON.stringify(box)})`);
  }
}

async function checkInternalAnchors(page, viewportName) {
  const failures = [];
  const anchors = await page.$$eval('a[href^="#"]', (links) =>
    links.map((link) => ({ href: link.getAttribute('href'), text: link.textContent?.replace(/\s+/g, ' ').trim() || link.getAttribute('aria-label') || '' }))
      .filter((link) => link.href && link.href.length > 1)
  );

  for (const anchor of anchors) {
    const id = decodeURIComponent(anchor.href.slice(1));
    const exists = await page.locator(`[id="${cssEscape(id)}"]`).count();
    if (!exists) {
      failures.push(`${viewportName}: broken internal anchor ${anchor.href} (${anchor.text})`);
      continue;
    }
    await page.goto(startUrl, { waitUntil: 'networkidle' });
    const clicked = await page.evaluate((href) => {
      const link = document.querySelector(`a[href="${href.replaceAll('"', '\\"')}"]`);
      if (!link) return false;
      link.click();
      return true;
    }, anchor.href);
    if (!clicked) {
      failures.push(`${viewportName}: could not find clickable internal anchor ${anchor.href}`);
      continue;
    }
    await page.waitForTimeout(80);
    const hash = await page.evaluate(() => window.location.hash);
    if (hash !== anchor.href) failures.push(`${viewportName}: clicking ${anchor.href} left URL hash as ${hash || '(empty)'}`);
  }
  return failures;
}

async function checkArtifactGallery(page, viewportName) {
  const failures = [];
  const galleryCount = await page.locator('[data-artifact-gallery]').count();
  if (!galleryCount) return failures;

  await expectVisible(page, '[data-artifact-search]', `${viewportName}: artifact search`, failures, { minWidth: 160, minHeight: 34 });
  await expectVisible(page, '[data-artifact-tag="all"]', `${viewportName}: artifact all filter`, failures, { minWidth: 44, minHeight: 34 });
  const cardCount = await page.locator('[data-artifact-card]').count();
  if (cardCount < 3) failures.push(`${viewportName}: artifact gallery should render at least 3 cards; found ${cardCount}`);

  const search = page.locator('[data-artifact-search]').first();
  await search.fill('deploy');
  await page.waitForTimeout(80);
  const searchVisible = await page.locator('[data-artifact-card]:visible').count();
  if (searchVisible < 1) failures.push(`${viewportName}: artifact search did not leave any deploy-related cards visible`);
  await search.fill('');

  const qaTag = page.locator('[data-artifact-tag="qa"]').first();
  if (await qaTag.count()) {
    await qaTag.click();
    await page.waitForTimeout(80);
    const url = page.url();
    const qaVisible = await page.locator('[data-artifact-card]:visible').count();
    if (!url.includes('tag=qa')) failures.push(`${viewportName}: artifact tag filter did not persist tag=qa in URL`);
    if (qaVisible < 1) failures.push(`${viewportName}: artifact qa tag did not leave any cards visible`);
  }
  return failures;
}

async function checkRoadmapBoard(page, viewportName) {
  const failures = [];
  const boardCount = await page.locator('[data-roadmap-board]').count();
  if (!boardCount) return failures;

  await expectVisible(page, '[data-roadmap-search]', `${viewportName}: roadmap search`, failures, { minWidth: 160, minHeight: 34 });
  await expectVisible(page, '[data-roadmap-priority="all"]', `${viewportName}: roadmap all filter`, failures, { minWidth: 80, minHeight: 34 });
  const cardCount = await page.locator('[data-roadmap-card]').count();
  if (cardCount < 3) failures.push(`${viewportName}: roadmap board should render at least 3 cards; found ${cardCount}`);

  const search = page.locator('[data-roadmap-search]').first();
  await search.fill('local');
  await page.waitForTimeout(80);
  const searchVisible = await page.locator('[data-roadmap-card]:visible').count();
  if (searchVisible < 1) failures.push(`${viewportName}: roadmap search did not leave any local-related cards visible`);
  await search.fill('');

  const high = page.locator('[data-roadmap-priority="high"]').first();
  if (await high.count()) {
    await high.click();
    await page.waitForTimeout(80);
    const highVisible = await page.locator('[data-roadmap-card]:visible').count();
    if (highVisible < 1) failures.push(`${viewportName}: roadmap high priority filter did not leave any cards visible`);
  }
  await page.locator('[data-roadmap-priority="all"]').first().click().catch(() => {});

  const firstSelect = page.locator('[data-roadmap-status]').first();
  if (await firstSelect.count()) {
    await firstSelect.selectOption('later');
    await page.waitForTimeout(80);
    const laterCards = await page.locator('[data-roadmap-column="later"] [data-roadmap-card]:visible').count();
    const stored = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('agentsite-roadmap-board:v1') || '{}')).length);
    if (laterCards < 1) failures.push(`${viewportName}: roadmap local status change did not move a card into later column`);
    if (stored < 1) failures.push(`${viewportName}: roadmap local status change did not write localStorage override`);
  }
  return failures;
}

function cssEscape(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function normalizeBasePath(value) {
  if (!value || value === '/') return '/';
  const withSlashes = `/${String(value).replace(/^\/+|\/+$/g, '')}/`;
  return withSlashes;
}

function readAstroBase() {
  const configPath = path.join(root, 'astro.config.mjs');
  if (!fs.existsSync(configPath)) return '/';
  const text = fs.readFileSync(configPath, 'utf8');
  const match = text.match(/base:\s*['"]([^'"]+)['"]/);
  return match?.[1] || '/';
}

async function waitForServer(url) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) throw new Error(`Astro preview exited early. Output:\n${serverOutput}`);
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for Astro preview at ${url}. Output:\n${serverOutput}`);
}

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: 'inherit', shell: process.platform === 'win32' });
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`Command failed: ${command} ${args.join(' ')}`)));
    child.on('error', reject);
  });
}

function stopServer(child) {
  return new Promise((resolve) => {
    if (!child || child.exitCode !== null) return resolve();
    const timer = setTimeout(() => {
      if (child.exitCode === null) child.kill('SIGKILL');
    }, 2000);
    child.once('exit', () => {
      clearTimeout(timer);
      resolve();
    });
    child.kill('SIGTERM');
  });
}

function findAvailablePort(startPort) {
  return new Promise((resolve) => {
    const tryPort = (candidate) => {
      const tester = net.createServer()
        .once('error', () => tryPort(candidate + 1))
        .once('listening', () => tester.close(() => resolve(candidate)))
        .listen(candidate, host);
    };
    tryPort(startPort);
  });
}
