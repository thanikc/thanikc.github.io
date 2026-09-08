#!/usr/bin/env node
// Ingests every Markdown file under apps/worker/content/ into the Vectorize
// index via the worker's POST /api/ingest endpoint. Each file becomes one
// document (id = file name); the worker chunks, embeds and upserts it.
//
//   node scripts/ingest.mjs                     # → http://localhost:8787 (wrangler dev)
//   node scripts/ingest.mjs --url https://thanikc-worker.<sub>.workers.dev
//   WORKER_URL=https://… INGEST_TOKEN=… node scripts/ingest.mjs
//
// INGEST_TOKEN is read from the environment or apps/worker/.env.

import { readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const CONTENT_DIR = resolve(HERE, '..', 'content');
const ENV_FILE = resolve(HERE, '..', '.env');

/** Parses one Markdown file into an ingest payload. Supports an optional
 *  `key: value` frontmatter block for metadata (and an `id` override). */
export function parseDoc(fileName, raw) {
  const base = fileName.replace(/\.md$/, '');
  const metadata = { section: base, source: `content/${fileName}` };
  let body = raw;

  const fm = raw.match(/^---\n([\s\S]*?)\n---\n?/);
  if (fm) {
    for (const line of fm[1].split('\n')) {
      const kv = line.match(/^([\w-]+):\s*(.*)$/);
      if (kv) metadata[kv[1]] = kv[2].trim();
    }
    body = raw.slice(fm[0].length);
  }

  const id = typeof metadata.id === 'string' && metadata.id ? metadata.id : base;
  return { id, text: body.trim(), metadata };
}

async function loadEnvFile(path) {
  try {
    const raw = await readFile(path, 'utf8');
    for (const line of raw.split('\n')) {
      const kv = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
      if (kv && !(kv[1] in process.env)) {
        process.env[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch {
    /* no .env file — rely on the real environment */
  }
}

function parseArgs(argv) {
  const args = { url: process.env.WORKER_URL || 'http://localhost:8787' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--url') args.url = argv[++i];
    else if (argv[i].startsWith('--url=')) args.url = argv[i].slice('--url='.length);
  }
  args.url = args.url.replace(/\/$/, '');
  return args;
}

async function main() {
  await loadEnvFile(ENV_FILE);
  const { url } = parseArgs(process.argv.slice(2));
  const token = process.env.INGEST_TOKEN;

  if (!token) {
    console.error('INGEST_TOKEN is not set (env or apps/worker/.env).');
    process.exit(1);
  }

  const files = (await readdir(CONTENT_DIR))
    .filter(f => f.endsWith('.md') && f !== 'README.md')
    .sort();

  if (files.length === 0) {
    console.error(`No .md files in ${CONTENT_DIR}.`);
    process.exit(1);
  }

  console.log(`Ingesting ${files.length} file(s) → ${url}/api/ingest\n`);
  let failed = 0;

  for (const file of files) {
    const raw = await readFile(join(CONTENT_DIR, file), 'utf8');
    const doc = parseDoc(file, raw);

    if (!doc.text) {
      console.warn(`  skip  ${file} (empty)`);
      continue;
    }

    const res = await fetch(`${url}/api/ingest`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify(doc),
    });
    const payload = await res.json().catch(() => ({}));

    if (res.ok) {
      console.log(`  ok    ${file} → id="${doc.id}", ${payload.chunks} chunk(s)`);
    } else {
      failed++;
      console.error(`  FAIL  ${file} → ${res.status} ${JSON.stringify(payload)}`);
    }
  }

  console.log(failed ? `\n${failed} file(s) failed.` : '\nDone.');
  process.exit(failed ? 1 : 0);
}

// Only run when invoked directly, not when imported by tests.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
