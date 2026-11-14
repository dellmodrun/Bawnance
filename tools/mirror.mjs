import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ORIGIN = 'https://vicecitymarkets.fun';
const ROOT = path.resolve(import.meta.dirname, '..');
const DIST = path.join(ROOT, 'site');
const initialRoutes = ['/', '/companies', '/streets', '/rides', '/portfolio', '/how-it-works'];
const routeQueue = [...initialRoutes];
const visited = new Set();
const downloaded = new Set();

const safeAsset = /^\/(?:assets\/[^?#]+\.(?:css|png|jpe?g|webp|avif|svg|gif|ico)|favicon\.png)$/i;
const routeLike = /^\/(?:$|companies\/?$|streets\/?$|rides\/?$|portfolio\/?$|how-it-works\/?$|asset\/[a-z0-9-]+\/?$)/i;

async function get(url, binary = false) {
  const response = await fetch(url, { headers: { 'user-agent': 'ViceCityMarketsLocalMirror/1.0' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return binary ? Buffer.from(await response.arrayBuffer()) : response.text();
}

function extract(html, attribute) {
  const values = [];
  const re = new RegExp(`${attribute}=["']([^"']+)["']`, 'gi');
  for (const match of html.matchAll(re)) values.push(match[1].replaceAll('&amp;', '&'));
  return values;
}

function outputFileForRoute(route) {
  if (route === '/') return path.join(DIST, 'index.html');
  return path.join(DIST, route.replace(/^\//, '').replace(/\/$/, ''), 'index.html');
}

function sanitize(html, route) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<link\b[^>]*rel=["']modulepreload["'][^>]*>/gi, '')
    .replace(/<link\b[^>]*href=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com[^>]*>/gi, '')
    .replace(/<meta\b[^>]*(?:property|name)=["'](?:og:image|twitter:image)["'][^>]*>/gi, '')
    .replace(/<meta\s+name=["']description["'][^>]*>/i, (m) => `${m}\n<meta name="vicecity-local-route" content="${route}">`)
    .replace('</head>', '<link rel="stylesheet" href="/local/local-demo.css"></head>')
    .replace('</body>', '<script src="/local/local-demo.js"></script></body>');
}

async function saveAsset(assetPath) {
  if (downloaded.has(assetPath)) return;
  downloaded.add(assetPath);
  const cleanPath = assetPath.split(/[?#]/)[0];
  const target = path.join(DIST, cleanPath.replace(/^\//, ''));
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, await get(`${ORIGIN}${cleanPath}`, true));
}

await mkdir(DIST, { recursive: true });

while (routeQueue.length) {
  const route = routeQueue.shift();
  if (visited.has(route)) continue;
  visited.add(route);
  const html = await get(`${ORIGIN}${route}`);

  for (const href of extract(html, 'href')) {
    const clean = href.split(/[?#]/)[0];
    if (routeLike.test(clean) && !visited.has(clean)) routeQueue.push(clean);
    if (safeAsset.test(clean)) await saveAsset(clean);
  }
  for (const src of extract(html, 'src')) {
    const clean = src.split(/[?#]/)[0];
    if (safeAsset.test(clean)) await saveAsset(clean);
  }

  const target = outputFileForRoute(route);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, sanitize(html, route), 'utf8');
  console.log(`page ${visited.size}: ${route}`);
}

await writeFile(path.join(ROOT, 'mirror-manifest.json'), JSON.stringify({
  source: ORIGIN,
  generatedAt: new Date().toISOString(),
  pageCount: visited.size,
  assetCount: downloaded.size,
  routes: [...visited].sort()
}, null, 2));

console.log(`Done: ${visited.size} pages, ${downloaded.size} assets.`);
