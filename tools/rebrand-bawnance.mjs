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
      const after = before
        .replaceAll('BAWSAQ', 'Bawnance')
        .replaceAll('/assets/styles-BvLcAyGw.css', '/assets/bawnance-theme.css')
        .replaceAll('Vice City Markets 本地前端', 'Bawnance 本地前端')
        .replaceAll('vicecitymarkets-local', 'bawnance')
        .replaceAll('Vice City Markets local is running', 'Bawnance local is running')
        .replace(/https:\/\/pub-[^"'<>\s]+\.png/g, '/assets/bawnance-logo.png');
      if (after !== before) await writeFile(target, after, 'utf8');
    }
  }
}

await visit(root);
console.log('Bawnance brand text and theme references updated.');
