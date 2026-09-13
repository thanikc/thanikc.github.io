/**
 * Serves `dist/thanikc/browser` the way GitHub Pages serves it, for the Playwright
 * design checks: a directory resolves to its `index.html`, and anything with no file
 * behind it gets `404.html` with a 404 status — which is what makes the language
 * redirect at the root reachable in a test at all. A plain static file server
 * answers its own 404 instead, and the pre-i18n URLs would look broken here while
 * working in production.
 */
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import { dirname, extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  process.env['SERVE_ROOT'] ?? 'dist/thanikc/browser',
);
const port = Number(process.env['PORT'] ?? 4300);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
};

const fileFor = async urlPath => {
  // normalize() collapses any ../ before the path is joined to the root.
  const candidate = join(root, normalize(decodeURIComponent(urlPath)));
  if (!candidate.startsWith(root)) return null;

  const found = await stat(candidate).catch(() => null);
  if (found?.isFile()) return candidate;
  if (found?.isDirectory()) {
    const index = join(candidate, 'index.html');
    return (await stat(index).catch(() => null))?.isFile() ? index : null;
  }
  return null;
};

createServer(async (req, res) => {
  const path = new URL(req.url ?? '/', 'http://localhost').pathname;
  const requested = await fileFor(path);
  const file = requested ?? (await fileFor('/404.html'));

  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
    return;
  }

  res.writeHead(requested ? 200 : 404, {
    'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
    'cache-control': 'no-store',
  });
  createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`serve-pages: http://127.0.0.1:${port}/`));
