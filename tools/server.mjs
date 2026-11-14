import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..', 'site');
const packageRoot = path.resolve(import.meta.dirname, '..');
const port = Number(process.env.PORT || 4173);
const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };

http.createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
    if (urlPath.startsWith('/_serverFn/')) {
      try {
        const cache = JSON.parse(await readFile(path.join(packageRoot, 'api-cache', 'manifest.json'), 'utf8'));
        const cached = cache[req.url];
        if (req.method === 'GET' && cached) {
          const body = await readFile(path.join(packageRoot, 'api-cache', cached.filename));
          res.writeHead(200, { 'content-type': cached.contentType, 'x-tss-serialized': 'true', 'cache-control': 'no-cache' });
          res.end(body);
          return;
        }
      } catch {}
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const requestHeaders = { ...req.headers };
      delete requestHeaders.host;
      delete requestHeaders.connection;
      delete requestHeaders['content-length'];
      if (requestHeaders.origin) requestHeaders.origin = 'https://vicecitymarkets.fun';
      if (requestHeaders.referer) requestHeaders.referer = 'https://vicecitymarkets.fun/';
      const upstream = await fetch(`https://vicecitymarkets.fun${req.url}`, {
        method: req.method,
        headers: requestHeaders,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
      });
      const body = Buffer.from(await upstream.arrayBuffer());
      res.writeHead(upstream.status, {
        'content-type': upstream.headers.get('content-type') || 'application/octet-stream',
        'cache-control': 'no-store',
      });
      res.end(body);
      return;
    }
    if (urlPath === '/__l5e/trackevents') {
      res.writeHead(202, { 'content-type': 'application/json' });
      res.end('{}');
      return;
    }
    let file = path.join(root, urlPath.replace(/^\/+/, ''));
    if (!file.startsWith(root)) throw new Error('Invalid path');
    try { if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html'); }
    catch { if (!path.extname(file)) file = path.join(file, 'index.html'); }
    const body = await readFile(file);
    const headers = { 'content-type': types[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-cache' };
    if (path.extname(file).toLowerCase() === '.mp4') {
      headers['accept-ranges'] = 'bytes';
      const range = req.headers.range;
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (match) {
          const start = match[1] ? Number(match[1]) : 0;
          const end = match[2] ? Math.min(Number(match[2]), body.length - 1) : body.length - 1;
          if (start <= end && start < body.length) {
            headers['content-range'] = `bytes ${start}-${end}/${body.length}`;
            headers['content-length'] = String(end - start + 1);
            res.writeHead(206, headers);
            res.end(body.subarray(start, end + 1));
            return;
          }
        }
      }
    }
    res.writeHead(200, headers);
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('404 - Page not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Bawnance local is running at http://127.0.0.1:${port}`);
});
