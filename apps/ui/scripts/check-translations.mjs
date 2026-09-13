/**
 * Checks `src/locale/messages.*.json` against the messages the app actually
 * contains: every source message is translated, no translation is left over from a
 * message that is gone, and the placeholders in each translation are exactly the
 * ones its source message uses.
 *
 * A placeholder mismatch is the failure worth catching here: Angular silently drops
 * a translation whose placeholders don't line up, so the string falls back to
 * English in a build that otherwise looks fine. Reformatting a `$localize` template
 * can also quietly change a message, which shows up here as an untranslated id.
 *
 * Run `pnpm --filter @thanikc/ui i18n:check`, which extracts first and then runs
 * this against the fresh extraction.
 */
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const localeDir = join(appRoot, 'src/locale');

const [, , extractedArg] = process.argv;
const extractedPath = extractedArg
  ? resolve(process.cwd(), extractedArg)
  : join(localeDir, 'messages.json');

const placeholders = message => (message.match(/\{\$[^}]+\}/g) ?? []).sort();

const readTranslations = async path => {
  const { translations } = JSON.parse(await readFile(path, 'utf8'));
  return translations ?? {};
};

const source = await readTranslations(extractedPath);
const problems = [];

for (const locale of ['de', 'th']) {
  const file = join(localeDir, `messages.${locale}.json`);
  const translated = await readTranslations(file);

  for (const [id, message] of Object.entries(source)) {
    if (!(id in translated)) {
      problems.push(`${locale}: no translation for "${id}" (${JSON.stringify(message)})`);
      continue;
    }

    const expected = placeholders(message);
    const actual = placeholders(translated[id]);
    if (expected.join('|') !== actual.join('|')) {
      problems.push(
        `${locale}: "${id}" uses placeholders [${actual}] but the message has [${expected}]`,
      );
    }
  }

  for (const id of Object.keys(translated)) {
    if (!(id in source)) problems.push(`${locale}: "${id}" is translated but no longer exists`);
  }
}

if (problems.length > 0) {
  console.error(`check-translations: ${problems.length} problem(s)\n- ${problems.join('\n- ')}`);
  process.exit(1);
}

console.log(
  `check-translations: de and th cover all ${Object.keys(source).length} messages, placeholders intact.`,
);
