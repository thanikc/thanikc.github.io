/**
 * Emits the deployment root of the static site, which the localized Angular build
 * cannot: `ng build` writes one complete copy of the site per locale into
 * `browser/en/`, `browser/de/` and `browser/th/` and leaves the root empty.
 *
 * This adds:
 *  - `index.html`, the page `https://thanikc.github.io/` serves: it picks the
 *    visitor's language and replaces itself with that locale's home page.
 *  - `404.html`, which GitHub Pages serves for any path it has no file for. It
 *    does the same thing while keeping the requested route, so the pre-i18n URLs
 *    (`/calculator`, `/privacy-policy`) and any shared deep link still land on the
 *    right page in the right language.
 *  - the files that only work at the root of a domain: robots.txt, sitemap.xml,
 *    ads.txt, llms.txt and the bare /favicon.ico request.
 *
 * The language logic is duplicated here as inline JavaScript on purpose: it has to
 * run before any bundle is fetched, and the root has no bundle of its own. Only the
 * logic is copied — the locale codes, the fallback and the storage key are read out
 * of `src/app/shared/i18n/locales.ts`, so there is still one source of truth and
 * this build step fails loudly if that file changes shape.
 *
 * Assumes the site is served from the root of its domain, which is what
 * `thanikc.github.io` is.
 */
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..');
const outDir = join(appRoot, 'dist/thanikc/browser');
const publicDir = join(appRoot, 'public');
const localesFile = join(appRoot, 'src/app/shared/i18n/locales.ts');

/** Files a crawler, an ad network or a browser only ever looks for at the root. */
const ROOT_FILES = ['robots.txt', 'sitemap.xml', 'ads.txt', 'llms.txt', 'favicon.ico'];

function fail(message) {
  throw new Error(`emit-pages-root: ${message}`);
}

/** Single-sources the locale data by reading the constants the Angular app uses. */
async function readLocaleConfig() {
  const source = await readFile(localesFile, 'utf8');

  const codes = source.match(/SUPPORTED_LOCALES = \[([^\]]+)\] as const;/);
  const fallback = source.match(/DEFAULT_LOCALE: SupportedLocale = '([a-z-]+)';/);
  const storageKey = source.match(/LOCALE_STORAGE_KEY = '([^']+)';/);

  if (!codes || !fallback || !storageKey) {
    fail(`could not read the locale constants out of ${localesFile}`);
  }

  const locales = [...codes[1].matchAll(/'([a-z-]+)'/g)].map(match => match[1]);
  if (locales.length === 0) fail('SUPPORTED_LOCALES is empty');

  return { locales, fallback: fallback[1], storageKey: storageKey[1] };
}

/**
 * `keepRoute` distinguishes the two pages: the root index always goes to a home
 * page, while 404.html carries the requested route across. A route already under a
 * locale that 404s does not exist in any language, so that one falls back to the
 * locale home page rather than being re-prefixed into a redirect loop.
 */
function redirectScript({ locales, fallback, storageKey }, keepRoute) {
  return `(function () {
  var locales = ${JSON.stringify(locales)};
  var key = ${JSON.stringify(storageKey)};
  function supported(tag) {
    var primary = String(tag || '').toLowerCase().split('-')[0];
    return locales.indexOf(primary) > -1 ? primary : null;
  }
  var chosen = null;
  try {
    chosen = supported(window.localStorage.getItem(key));
  } catch (e) {
    /* storage blocked: fall through to the browser's own languages */
  }
  var tags = navigator.languages && navigator.languages.length
    ? navigator.languages
    : [navigator.language];
  for (var i = 0; i < tags.length && !chosen; i++) chosen = supported(tags[i]);
  var locale = chosen || ${JSON.stringify(fallback)};
  var route = '';
${
  keepRoute
    ? `  var path = window.location.pathname.replace(/^\\/+/, '');
  var first = path.split('/')[0];
  route = locales.indexOf(first) > -1 ? '' : path;
  var tail = route ? window.location.search + window.location.hash : '';
  window.location.replace('/' + locale + '/' + route + tail);`
    : `  window.location.replace(
    '/' + locale + '/' + route + window.location.search + window.location.hash
  );`
}
})();`;
}

function page(config, { keepRoute, title, heading, body, noindex }) {
  const links = config.locales
    .map(locale => `<a href="/${locale}/">${locale.toUpperCase()}</a>`)
    .join('\n        ');

  return `<!doctype html>
<html lang="${config.fallback}">
  <head>
    <meta charset="utf-8" />
    <title>${title}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
${noindex ? '    <meta name="robots" content="noindex" />\n' : ''}    <link rel="canonical" href="https://thanikc.github.io/${config.fallback}/" />
    <link rel="icon" href="favicon.ico" sizes="any" />
    <style>
      /* Self-contained: this page must not wait on the bundle it is redirecting to. */
      body {
        margin: 0;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        gap: 1rem;
        align-items: center;
        justify-content: center;
        background: #0d352e;
        color: #fff;
        font: 1rem/1.5 Arial, Helvetica, sans-serif;
        text-align: center;
        padding: 1.5rem;
      }
      p {
        margin: 0;
      }
      nav {
        display: flex;
        gap: 0.5rem;
      }
      a {
        color: #0d352e;
        background: #dad6ce;
        text-decoration: none;
        border-radius: 999px;
        padding: 0.75rem 1.25rem;
        font-weight: 700;
      }
      a:hover,
      a:focus-visible {
        background: #fff;
      }
    </style>
    <script>
${redirectScript(config, keepRoute)}
    </script>
  </head>
  <body>
    <p>${heading}</p>
    <noscript><p>${body}</p></noscript>
    <nav aria-label="Language">
        ${links}
    </nav>
  </body>
</html>
`;
}

const config = await readLocaleConfig();

await mkdir(outDir, { recursive: true });

await writeFile(
  join(outDir, 'index.html'),
  page(config, {
    keepRoute: false,
    title: 'Thanik Cheowtirakul — Full-stack engineer',
    heading: 'Taking you to your language…',
    body: 'Choose a language to continue.',
    noindex: false,
  }),
);

await writeFile(
  join(outDir, '404.html'),
  page(config, {
    keepRoute: true,
    title: 'Page not found — Thanik Cheowtirakul',
    heading: 'Looking for that page…',
    body: 'That page moved. Choose a language to continue.',
    noindex: true,
  }),
);

for (const file of ROOT_FILES) {
  await copyFile(join(publicDir, file), join(outDir, file));
}

console.log(
  `emit-pages-root: root index.html + 404.html for [${config.locales.join(', ')}], ` +
    `and ${ROOT_FILES.length} root files.`,
);
