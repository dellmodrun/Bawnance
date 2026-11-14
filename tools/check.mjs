import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const site = path.join(root, 'site');
const manifest = JSON.parse(await readFile(path.join(root, 'mirror-manifest.json'), 'utf8'));
const failures = [];
const localRefs = new Set();

for (const route of manifest.routes) {
  const file = route === '/' ? path.join(site, 'index.html') : path.join(site, route.slice(1), 'index.html');
  try {
    const html = await readFile(file, 'utf8');
    if (!html.includes('/assets/index-Doa9XxR5.js')) failures.push(`${route}: original application entry missing`);
    if (html.includes('fonts.googleapis.com/css2')) failures.push(`${route}: remote font stylesheet remains`);
    for (const match of html.matchAll(/(?:href|src)=["'](\/[^"'#?]+)["']/g)) localRefs.add(match[1]);
  } catch {
    failures.push(`${route}: HTML missing`);
  }
}

for (const file of ['assets/index-Doa9XxR5.js', 'assets/routes-CmbTlaT2.js', 'assets/styles-BvLcAyGw.css', 'assets/bawnance-theme.css', 'assets/bawnance-logo.png', 'assets/vice-city-hero-DHvS_FUQ.jpg', '__l5e/events.270c78a44fc53e7b.js', '__l5e/assets-v1/905c123b-ce33-4695-975f-ff781b06d3d9/intro-vice-city.mp4', 'local/google-fonts.css']) {
  localRefs.add(`/${file}`);
}

for (const ref of localRefs) {
  if (ref === '/' || manifest.routes.includes(ref) || ref.startsWith('/asset/')) continue;
  const target = path.join(site, ref.slice(1));
  try {
    const info = await stat(target);
    if (!info.isFile() || info.size === 0) failures.push(`empty local asset: ${ref}`);
  } catch {
    failures.push(`missing local asset: ${ref}`);
  }
}

const entry = await readFile(path.join(site, 'assets', 'index-Doa9XxR5.js'), 'utf8');
for (const match of entry.matchAll(/["'](\/assets\/[^"']+\.(?:js|css|jpg|png))["']/g)) {
  try { await stat(path.join(site, match[1].slice(1))); } catch { failures.push(`entry chunk missing: ${match[1]}`); }
}

if (failures.length) {
  console.error([...new Set(failures)].join('\n'));
  process.exit(1);
}
console.log(`PASS: ${manifest.pageCount} routes, original app code, intro video, images and local fonts verified.`);
