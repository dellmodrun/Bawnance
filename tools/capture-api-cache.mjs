import { chromium } from '../../onemod/node_modules/playwright/index.mjs';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const cacheDir = path.join(root, 'api-cache');
const manifest = JSON.parse(await readFile(path.join(root, 'mirror-manifest.json'), 'utf8'));
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
let entries = {};
try { entries = JSON.parse(await readFile(path.join(cacheDir, 'manifest.json'), 'utf8')); } catch {}
const jobs = new Set();
await mkdir(cacheDir, { recursive: true });

async function capture(response) {
  const parsed = new URL(response.url());
  if (parsed.origin !== 'https://vicecitymarkets.fun' || !parsed.pathname.startsWith('/_serverFn/') || response.status() !== 200 || response.request().method() !== 'GET') return;
  const key = `${parsed.pathname}${parsed.search}`;
  if (entries[key]) return;
  const filename = `${createHash('sha256').update(key).digest('hex')}.bin`;
  const body = await response.body();
  await writeFile(path.join(cacheDir, filename), body);
  entries[key] = { filename, contentType: response.headers()['content-type'] || 'application/json', bytes: body.length };
}

async function visit(route) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const page = await context.newPage();
    page.on('response', (response) => {
      const job = capture(response).catch(() => {}).finally(() => jobs.delete(job));
      jobs.add(job);
    });
    try {
      await page.goto(`https://vicecitymarkets.fun${route}`, { waitUntil: 'domcontentloaded', timeout: 45000 });
      await page.waitForTimeout(route === '/' ? 6000 : 1200);
      await page.close();
      console.log(`cached ${route}`);
      return;
    } catch (error) {
      await page.close();
      if (attempt === 3) console.warn(`skipped ${route}: ${error.message}`);
    }
  }
}

await visit('/');
const routes = process.argv.includes('--home') ? [] : manifest.routes.filter((route) => route !== '/');
for (let index = 0; index < routes.length; index += 4) await Promise.all(routes.slice(index, index + 4).map(visit));
await Promise.all([...jobs]);
await writeFile(path.join(cacheDir, 'manifest.json'), JSON.stringify(entries, null, 2));
await browser.close();
console.log(`Captured ${Object.keys(entries).length} exact GET API responses.`);
