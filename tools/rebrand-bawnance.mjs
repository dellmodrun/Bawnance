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
        .replaceAll('/assets/styles-BvLcAyGw.css', '/assets/bawnance-theme.css')
        .replaceAll('Vice City Markets 本地前端', 'Bawnance 本地前端')
        .replaceAll('vicecitymarkets-local', 'bawnance')
        .replaceAll('Vice City Markets local is running', 'Bawnance local is running')
        .replace(/https:\/\/pub-[^"'<>\s]+\.png/g, '/assets/bawnance-logo.png');
      if (path.extname(entry.name).toLowerCase() === '.html') {
        after = after
          .replace(/<link rel="icon" href="\/favicon\.png(?:\?[^\"]*)?" type="image\/png"\/>/, '<link rel="icon" href="/favicon.png?v=2" type="image/png"/><link rel="apple-touch-icon" href="/favicon.png?v=2"/>')
          .replace('</head>', '<script src="/assets/bawnance-ui.js" defer></script></head>');
        after = after.replace(/(?:<script src="\/assets\/bawnance-ui\.js" defer><\/script>){2,}/g, '<script src="/assets/bawnance-ui.js" defer></script>');
      }
      if (after !== before) await writeFile(target, after, 'utf8');
    }
  }
}

await visit(root);
console.log('Bawnance brand text and theme references updated.');
