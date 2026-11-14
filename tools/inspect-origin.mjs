import { chromium } from '../../onemod/node_modules/playwright/index.mjs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();
const requests = [];
page.on('response', async (response) => requests.push({ status: response.status(), url: response.url(), type: response.request().resourceType(), ...(response.url().includes('/_serverFn/') ? { requestHeaders: await response.request().allHeaders() } : {}) }));
await page.goto('https://vicecitymarkets.fun/', { waitUntil: 'domcontentloaded', timeout: 60000 });

for (const delay of [0, 250, 750, 1500, 2500, 4000]) {
  if (delay) await page.waitForTimeout(delay - ([0, 250, 750, 1500, 2500, 4000][[0, 250, 750, 1500, 2500, 4000].indexOf(delay) - 1] || 0));
  await page.screenshot({ path: path.join(root, `origin-intro-${delay}.png`) });
}

const report = await page.evaluate(() => ({
  title: document.title,
  htmlClass: document.documentElement.className,
  bodyClass: document.body.className,
  bodyChildren: [...document.body.children].map((node) => ({ tag: node.tagName, id: node.id, className: String(node.className), text: node.textContent?.trim().slice(0, 160) })),
  images: [...document.images].map((img) => ({ src: img.src, alt: img.alt, className: img.className, complete: img.complete, naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight })),
  videos: [...document.querySelectorAll('video')].map((video) => ({ src: video.currentSrc || video.src, className: video.className, poster: video.poster })),
  scripts: [...document.scripts].map((script) => script.src || '[inline]'),
}));
await writeFile(path.join(root, 'origin-inspection.json'), JSON.stringify({ report, requests }, null, 2));
await browser.close();
