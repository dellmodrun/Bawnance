import { chromium } from '../../onemod/node_modules/playwright/index.mjs';
import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const context = await browser.newContext();
let captured;
for (let attempt = 1; attempt <= 8 && !captured; attempt++) {
  const page = await context.newPage();
  try {
    const target = await new Promise(async (resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('server function response timeout')), 30000);
      page.on('response', async (response) => {
        if (response.url().includes('/_serverFn/b9345bf82c') && response.status() === 200) {
          clearTimeout(timer);
          resolve({ url: response.url(), status: response.status(), headers: await response.allHeaders(), requestHeaders: await response.request().allHeaders(), body: await response.body() });
        }
      });
      await page.goto('https://vicecitymarkets.fun/', { waitUntil: 'domcontentloaded', timeout: 45000 });
    });
    captured = target;
  } catch (error) {
    console.warn(`attempt ${attempt}: ${error.message}`);
  } finally {
    await page.close();
  }
}
if (!captured) throw new Error('Could not capture the stock server-function response.');
await writeFile(path.join(root, 'stock-api-response.bin'), captured.body);
await writeFile(path.join(root, 'stock-api-response.json'), JSON.stringify({ url: captured.url, status: captured.status, headers: captured.headers, requestHeaders: captured.requestHeaders }, null, 2));
console.log(`Captured ${captured.body.length} bytes.`);
await browser.close();
