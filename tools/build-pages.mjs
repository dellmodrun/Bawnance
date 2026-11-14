import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const source = path.join(root, 'site');
const output = path.join(root, 'pages-dist');
const base = '/Bawnance';

await rm(output, { recursive: true, force: true });
await cp(source, output, { recursive: true });

const manifest = JSON.parse(await readFile(path.join(root, 'mirror-manifest.json'), 'utf8'));
const intro = `<div id="bawsaq-intro" class="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-background transition-all duration-700 opacity-100"><video src="${base}/__l5e/assets-v1/905c123b-ce33-4695-975f-ff781b06d3d9/intro-vice-city.mp4" poster="${base}/assets/vice-city-hero-DHvS_FUQ.jpg" autoplay muted loop playsinline class="absolute inset-0 h-full w-full object-cover"></video><div class="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/60"></div><div class="absolute inset-0 scanlines opacity-30"></div><div class="absolute inset-x-0 bottom-0 h-1.5 bg-stripe"></div><div class="relative flex flex-col items-center px-6 text-center animate-in fade-in zoom-in-95 duration-1000"><div class="text-xs uppercase tracking-[0.5em] text-accent neon-cyan">Leonida · Est. 2026</div><h1 class="mt-4 font-logo text-8xl leading-none text-vi glow-vi md:text-[11rem]">Bawnance</h1><div class="mt-2 font-heading text-lg tracking-[0.35em] text-foreground/90 md:text-2xl">Vice City Stock Exchange</div><p class="mt-6 max-w-md text-foreground/80">Stocks, businesses, real estate and rides. Paid in SOL. Every trade moves the price.</p><button id="bawsaq-enter" class="group mt-10 border-2 border-primary bg-primary/10 px-10 py-4 font-heading text-xl tracking-[0.3em] text-primary neon-pink glow-box backdrop-blur-sm transition hover:scale-105 hover:bg-primary hover:text-primary-foreground">Enter the exchange <span class="inline-block transition group-hover:translate-x-1">→</span></button><div class="mt-6 text-[10px] uppercase tracking-[0.4em] text-muted-foreground">Real mainnet SOL · Trade at your own risk</div></div></div>`;
const introScript = `<script>document.body.style.overflow='hidden';document.getElementById('bawsaq-enter').addEventListener('click',function(){var el=document.getElementById('bawsaq-intro');el.classList.add('scale-110','opacity-0');document.body.style.overflow='';setTimeout(function(){el.remove()},700)})</script>`;

for (const route of manifest.routes) {
  const file = route === '/' ? path.join(output, 'index.html') : path.join(output, route.slice(1), 'index.html');
  let html = await readFile(file, 'utf8');
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
  html = html.replace(/\b(href|src)="\/(?!\/)/g, `$1="${base}/`);
  if (route === '/') html = html.replace('<body>', `<body>${intro}`).replace('</body>', `${introScript}</body>`);
  html = html.replace('</body>', `<script src="${base}/assets/bawnance-ui.js?v=3"></script></body>`);
  await writeFile(file, html, 'utf8');
}

const fontCssFile = path.join(output, 'local', 'google-fonts.css');
const fontCss = (await readFile(fontCssFile, 'utf8')).replaceAll('url(/local/', `url(${base}/local/`);
await writeFile(fontCssFile, fontCss, 'utf8');

await writeFile(path.join(output, '.nojekyll'), '');
console.log(`GitHub Pages bundle created at ${output}`);
