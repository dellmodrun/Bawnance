import { chromium } from '../../onemod/node_modules/playwright/index.mjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const site = path.join(root, 'site');
const manifest = JSON.parse(await readFile(path.join(root, 'mirror-manifest.json'), 'utf8'));
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const request = await browser.newContext().then((context) => context.request);
const url = 'https://fonts.googleapis.com/css2?family=Arimo:wght@400;500;700&family=Archivo+Narrow:wght@500;700&family=Archivo+Black&family=JetBrains+Mono:wght@400;600&family=Kaushan+Script&family=Playfair+Display:wght@800;900&display=swap';
const response = await request.get(url, { headers: { 'user-agent': 'Mozilla/5.0 Chrome/144.0.0.0 Safari/537.36' } });
if (!response.ok()) throw new Error(`Font stylesheet failed: ${response.status()}`);
let css = await response.text();
for (const match of [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)]) {
  const remote = match[1];
  const filename = new URL(remote).pathname.split('/').pop();
  const font = await request.get(remote);
  if (!font.ok()) throw new Error(`Font failed: ${font.status()} ${remote}`);
  await mkdir(path.join(site, 'local', 'fonts'), { recursive: true });
  await writeFile(path.join(site, 'local', 'fonts', filename), await font.body());
  css = css.replaceAll(remote, `/local/fonts/${filename}`);
}
await writeFile(path.join(site, 'local', 'google-fonts.css'), css, 'utf8');
for (const route of manifest.routes) {
  const file = route === '/' ? path.join(site, 'index.html') : path.join(site, route.slice(1), 'index.html');
  const html = (await readFile(file, 'utf8'))
    .replace(/https:\/\/fonts\.googleapis\.com\/css2\?[^"']+/g, '/local/google-fonts.css');
  await writeFile(file, html, 'utf8');
}
const entryFile = path.join(site, 'assets', 'index-Doa9XxR5.js');
const entry = (await readFile(entryFile, 'utf8'))
  .replaceAll('https://fonts.googleapis.com/css2?family=Arimo:wght@400;500;700&family=Archivo+Narrow:wght@500;700&family=Archivo+Black&family=JetBrains+Mono:wght@400;600&family=Kaushan+Script&family=Playfair+Display:wght@800;900&display=swap', '/local/google-fonts.css');
await writeFile(entryFile, entry, 'utf8');
await browser.close();
console.log('Local font bundle installed.');
