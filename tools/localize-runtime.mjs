import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const entryFile = path.resolve(import.meta.dirname, '..', 'site', 'assets', 'index-Doa9XxR5.js');
const googleUrl = 'https://fonts.googleapis.com/css2?family=Arimo:wght@400;500;700&family=Archivo+Narrow:wght@500;700&family=Archivo+Black&family=JetBrains+Mono:wght@400;600&family=Kaushan+Script&family=Playfair+Display:wght@800;900&display=swap';
const entry = (await readFile(entryFile, 'utf8'))
  .replaceAll(googleUrl, '/local/google-fonts.css');
await writeFile(entryFile, entry, 'utf8');
const root = path.resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await readFile(path.join(root, 'mirror-manifest.json'), 'utf8'));
const preconnects = '<link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"/>';
for (const route of manifest.routes) {
  const file = route === '/' ? path.join(root, 'site', 'index.html') : path.join(root, 'site', route.slice(1), 'index.html');
  let html = await readFile(file, 'utf8');
  if (!html.includes('rel="preconnect" href="https://fonts.googleapis.com"')) html = html.replace('<script defer src="/__l5e/', `${preconnects}<script defer src="/__l5e/`);
  await writeFile(file, html, 'utf8');
}
console.log('Runtime font references localized.');
