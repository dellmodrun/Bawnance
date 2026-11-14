import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const allowed = new Set(['.html', '.js', '.mjs', '.css', '.json', '.md', '.cmd', '.yml', '.yaml']);

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name === '.git' || entry.name === 'pages-dist' || entry.name === 'api-cache' || entry.name === 'rebrand-bawnance.mjs') continue;
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) await visit(target);
    else if (allowed.has(path.extname(entry.name).toLowerCase())) {
      const before = await readFile(target, 'utf8');
      let after = before
        .replaceAll('BAWSAQ', 'Bawnance')
        .replaceAll("Dealing in Vice City's ups and downs.", "Vice City's exchange for every hustle.")
        .replaceAll('Dealing in Vice City&#x27;s ups and downs.', 'Vice City&#x27;s exchange for every hustle.')
        .replaceAll('Bawnance is a player-run exchange for Vice City. You buy shares with Solana, the price moves on every trade, and you sell to whoever shows up next. Six steps, no accounts, no waiting rooms.', "Bawnance is Vice City's crypto-style exchange, built for every hustle. Trade stocks, businesses, real estate and rides with SOL; every trade moves the market. Six steps, no accounts, no waiting rooms.")
        .replace(/3tZb[A-HJ-NP-Za-km-z1-9]{40,50}/g, '')
        .replaceAll('VCSX', 'BAWNANCE')
        .replaceAll('vcsx', 'bawnance')
        .replaceAll('/assets/styles-BvLcAyGw.css', '/assets/bawnance-theme.css')
        .replaceAll('Vice City Markets 本地前端', 'Bawnance 本地前端')
        .replaceAll('vicecitymarkets-local', 'bawnance')
        .replaceAll('Vice City Markets local is running', 'Bawnance local is running')
        .replace(/https:\/\/pub-[^"'<>\s]+\.png/g, '/assets/bawnance-logo.png');
      if (path.extname(entry.name).toLowerCase() === '.html') {
        after = after
          .replace(/<span class="border border-border bg-card px-3 py-1\.5">Treasury[\s\S]*?<\/span><\/span>/g, '')
          .replace(/<link rel="apple-touch-icon" href="\/favicon\.png(?:\?[^\"]*)?"\/>/g, '')
          .replace(/<link rel="icon" href="\/favicon\.png(?:\?[^\"]*)?" type="image\/png"\/>/, '<link rel="icon" href="/favicon.png?v=3" type="image/png"/><link rel="apple-touch-icon" href="/favicon.png?v=3"/>')
          .replace('</head>', '<script src="/assets/bawnance-ui.js?v=4" defer></script></head>');
        after = after.replace(/(?:<script src="\/assets\/bawnance-ui\.js(?:\?v=\d+)?" defer><\/script>){2,}/g, '<script src="/assets/bawnance-ui.js?v=4" defer></script>');
      }
      if (entry.name.startsWith('how-it-works-') && path.extname(entry.name).toLowerCase() === '.js') {
        after = after.replace(/,\(0,p\.jsxs\)\(`span`,\{className:`border border-border bg-card px-3 py-1\.5`,children:\[`Treasury `,\(0,p\.jsx\)\(`span`,\{className:`text-accent`,children:i\(s\)\}\)\]\}\)/g, '');
      }
      if (after !== before) await writeFile(target, after, 'utf8');
    }
  }
}

await visit(root);
console.log('Bawnance brand text and theme references updated.');
