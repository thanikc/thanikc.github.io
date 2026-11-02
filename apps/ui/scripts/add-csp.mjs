/**
 * Adds a Content-Security-Policy <meta> to every HTML page of the static build.
 *
 * Angular's `autoCsp` cannot be used: it refuses to combine with SSR/prerendering.
 * So this hashes the finished pages instead. Scripts are trusted by hash only:
 * each inline <script> by its sha256, external bundles are attached by a hashed inline
 * loader (the parser-inserted tags would not extend trust to their own imports), and
 * 'strict-dynamic' lets that loader's scripts import the lazy chunks and load gtag.js.
 * No 'unsafe-inline' for scripts, no origin allow-list.
 *
 * style-src keeps 'unsafe-inline' because Angular and Material set inline styles
 * and emit <style> blocks that cannot be hashed ahead of time.
 *
 * Idempotent: an existing policy meta is replaced, never duplicated.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const META = /<meta http-equiv="Content-Security-Policy"[^>]*>\s*/g;
const SCRIPT = /<script\b([^>]*)>([\s\S]*?)<\/script>/g;
const PRELOAD = /<link\b([^>]*\brel="modulepreload"[^>]*)>/g;
const JS_TYPES = new Set(['', 'text/javascript', 'module']);

const sha256 = data => createHash('sha256').update(data).digest('base64');
const attr = (attrs, name) => attrs.match(new RegExp(`\\s${name}="([^"]*)"`))?.[1];

/** `readExternal(src)` returns the bytes of a same-origin script file. */
export function addCsp(html, readExternal) {
  const hashes = new Set();
  const external = [];
  let first = true;
  const stripped = html.replace(META, '').replace(SCRIPT, (tag, attrs, body) => {
    if (!JS_TYPES.has(attr(attrs, 'type') ?? '')) return tag; // data blocks never execute
    const src = attr(attrs, 'src');
    if (!src) {
      hashes.add(sha256(body));
      return tag;
    }
    external.push(src);
    // Replaced by one loader at the first one's position.
    if (!first) return '';
    first = false;
    return '<!--csp-loader-->';
  });
  // A parser-inserted script's own imports are not trusted by 'strict-dynamic', so the
  // bundles are attached by a hashed inline loader (async=false keeps their order).
  const loader = `<script>${JSON.stringify(external)}.forEach(function(s){var e=document.createElement("script");e.src=s;e.type="module";e.async=false;document.head.appendChild(e)});</script>`;
  const withLoader = external.length
    ? stripped.replace('<!--csp-loader-->', () => {
        hashes.add(sha256(loader.slice(8, -9)));
        return loader;
      })
    : stripped;

  // Preloaded chunks are fetched as scripts, so they need the same hash + integrity.
  const withPreloads = withLoader.replace(PRELOAD, (tag, attrs) => {
    const href = attr(attrs, 'href');
    const known = attr(attrs, 'integrity');
    if (known) hashes.add(known.replace('sha256-', ''));
    if (!href || known) return tag;
    const digest = sha256(readExternal(href));
    hashes.add(digest);
    return tag.replace('<link', `<link integrity="sha256-${digest}"`);
  });

  const policy = [
    `script-src ${[...hashes].map(h => `'sha256-${h}'`).join(' ')} 'strict-dynamic'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `style-src 'self' 'unsafe-inline'`,
  ].join('; ');
  const meta = `<meta http-equiv="Content-Security-Policy" content="${policy}">`;
  // First in <head>, so it governs everything after it.
  return withPreloads.replace(/<head>/, `<head>${meta}`);
}

async function* htmlFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(path);
    else if (entry.name.endsWith('.html')) yield path;
  }
}

async function main() {
  const outDir = join(
    resolve(dirname(fileURLToPath(import.meta.url)), '..'),
    'dist/thanikc/browser',
  );
  let count = 0;
  for await (const file of htmlFiles(outDir)) {
    const html = await readFile(file, 'utf8');
    // Scripts resolve against <base href> ('/de/'), not the page's own folder.
    const base = join(outDir, html.match(/<base href="([^"]*)"/)?.[1] ?? '/');
    const next = addCsp(html, src => readFileSync(join(base, src)));
    await writeFile(file, next);
    count++;
  }
  console.log(`add-csp: policy meta added to ${count} pages.`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) await main();
