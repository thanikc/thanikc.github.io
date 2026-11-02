import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { test } from 'node:test';
import { addCsp } from './add-csp.mjs';

const h = s => createHash('sha256').update(s).digest('base64');
const page = `<html><head><title>t</title><script>var a=1;</script><script id="ng-state" type="application/json">{}</script><link rel="modulepreload" href="c.js"><script src="main.js" type="module"></script></head></html>`;
const read = () => 'bundle';

test('hashes inline and external scripts, skips JSON data', () => {
  const out = addCsp(page, read);
  assert.match(out, new RegExp(`'sha256-${h('var a=1;').replace(/\+/g, '\\+')}'`));
  assert.ok(!out.includes('<script src='));
  const loader =
    '["main.js"].forEach(function(s){var e=document.createElement("script");e.src=s;e.type="module";e.async=false;document.head.appendChild(e)});';
  assert.ok(out.includes(`<script>${loader}</script>`));
  assert.ok(out.includes(h(loader)));
  assert.ok(!out.includes(h('{}')));
  assert.match(out, /'strict-dynamic'/);
  assert.ok(!/script-src[^;]*unsafe-inline/.test(out));
});

test('is idempotent', () => {
  const once = addCsp(page, read);
  assert.equal(addCsp(once, read), once);
});

test('hashes modulepreload links too', () => {
  assert.ok(
    addCsp(page, read).includes(`<link integrity="sha256-${h('bundle')}" rel="modulepreload"`),
  );
});
