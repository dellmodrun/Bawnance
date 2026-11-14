import { chromium } from '../../onemod/node_modules/playwright/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ORIGIN = 'https://vicecitymarkets.fun';
const root = path.resolve(import.meta.dirname, '..');
const site = path.join(root, 'site');
const manifest = JSON.parse(await readFile(path.join(root, 'mirror-manifest.json'), 'utf8'));
const saved = new Set();
const pending = new Set();

function localPath(url) {
  const parsed = new URL(url);
  if (parsed.origin !== ORIGIN) return null;
  const pathname = decodeURIComponent(parsed.pathname);
  if (pathname.startsWith('/_serverFn/') || pathname === '/__l5e/trackevents') return null;
  if (pathname === '/') return path.join(site, 'index.html');
  return path.join(site, pathname.replace(/^\/+/, ''));
}

async function saveResponse(response) {
  const request = response.request();
  if (request.method() !== 'GET' || response.status() < 200 || response.status() >= 300) return;
  const target = localPath(response.url());
  if (!target || saved.has(target)) return;
  const type = request.resourceType();
  if (!['script', 'stylesheet', 'image', 'media', 'font'].includes(type)) return;
  saved.add(target);
  try {
    const body = await response.body();
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body);
  } catch (error) {
    saved.delete(target);
    console.warn(`Could not save ${response.url()}: ${error.message}`);
  }
}

const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });

for (const route of manifest.routes) {
  const page = await context.newPage();
  page.on('response', (response) => {
    const job = saveResponse(response).finally(() => pending.delete(job));
    pending.add(job);
  });
  const response = await page.goto(`${ORIGIN}${route}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
  if (!response?.ok()) throw new Error(`Navigation failed for ${route}: ${response?.status()}`);
  const html = await response.text();
  const target = route === '/' ? path.join(site, 'index.html') : path.join(site, route.slice(1), 'index.html');
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, html, 'utf8');
  await page.waitForTimeout(route === '/' ? 3500 : 350);
  await page.close();
  console.log(`page ${route}`);
}

await Promise.all([...pending]);

// Keep the exact typefaces available without a Google Fonts connection.
const googleFontsUrl = 'https://fonts.googleapis.com/css2?family=Arimo:wght@400;500;700&family=Archivo+Narrow:wght@500;700&family=Archivo+Black&family=JetBrains+Mono:wght@400;600&family=Kaushan+Script&family=Playfair+Display:wght@800;900&display=swap';
const fontCssResponse = await context.request.get(googleFontsUrl, { headers: { 'user-agent': 'Mozilla/5.0 Chrome/144.0.0.0 Safari/537.36' } });
if (!fontCssResponse.ok()) throw new Error(`Google Fonts stylesheet failed: ${fontCssResponse.status()}`);
let fontCss = await fontCssResponse.text();
for (const match of [...fontCss.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)]) {
  const remoteUrl = match[1];
  const filename = new URL(remoteUrl).pathname.split('/').pop();
  const localUrl = `/local/fonts/${filename}`;
  const fontResponse = await context.request.get(remoteUrl);
  if (!fontResponse.ok()) throw new Error(`Font failed: ${fontResponse.status()} ${remoteUrl}`);
  const fontTarget = path.join(site, localUrl.slice(1));
  await mkdir(path.dirname(fontTarget), { recursive: true });
  await writeFile(fontTarget, await fontResponse.body());
  fontCss = fontCss.replaceAll(remoteUrl, localUrl);
}
await mkdir(path.join(site, 'local'), { recursive: true });
await writeFile(path.join(site, 'local', 'google-fonts.css'), fontCss, 'utf8');
for (const route of manifest.routes) {
  const target = route === '/' ? path.join(site, 'index.html') : path.join(site, route.slice(1), 'index.html');
  const html = (await readFile(target, 'utf8'))
    .replace(/https:\/\/fonts\.googleapis\.com\/css2\?[^"']+/g, '/local/google-fonts.css');
  await writeFile(target, html, 'utf8');
}
const runtimeFile = path.join(site, 'assets', 'index-Doa9XxR5.js');
const runtime = (await readFile(runtimeFile, 'utf8'))
  .replaceAll(googleFontsUrl, '/local/google-fonts.css');
await writeFile(runtimeFile, runtime, 'utf8');

// A ranged media response only contains a fragment. Download the complete intro file explicitly.
const introUrl = `${ORIGIN}/__l5e/assets-v1/905c123b-ce33-4695-975f-ff781b06d3d9/intro-vice-city.mp4`;
const introResponse = await context.request.get(introUrl, { timeout: 120000 });
if (!introResponse.ok()) throw new Error(`Intro video download failed: ${introResponse.status()}`);
const introTarget = localPath(introUrl);
await mkdir(path.dirname(introTarget), { recursive: true });
await writeFile(introTarget, await introResponse.body());

await browser.close();
console.log(`Saved the original application and ${saved.size} loaded assets.`);
