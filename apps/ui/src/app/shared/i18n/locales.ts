/**
 * The languages the site is built in, and the pure logic that decides which one a
 * visitor gets. Angular compiles one bundle per locale, each served from its own
 * subpath (`/en/`, `/de/`, `/th/` — see the `i18n` block in `angular.json`), so
 * "switching language" is a document navigation, not in-app state.
 *
 * `scripts/emit-pages-root.mjs` reads the constants below to generate the redirect
 * page at the deployment root; keep them in the literal shape it expects.
 */

export const SUPPORTED_LOCALES = ['en', 'de', 'th'] as const;

export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

/** Used when the visitor's browser asks for a language the site is not built in. */
export const DEFAULT_LOCALE: SupportedLocale = 'en';

/** Local-storage key holding an explicit choice from the language selector. */
export const LOCALE_STORAGE_KEY = 'preferred-language';

export interface LocaleOption {
  readonly code: SupportedLocale;
  /** Endonym: each language names itself, so it is readable to the one person who needs it. */
  readonly label: string;
  /** Two-letter form for the collapsed selector in the header. */
  readonly shortLabel: string;
  /**
   * Language-region tag in the same 'xx-YY' shape `navigator.language` returns, e.g.
   * `en-US`. A flag is a country's, not a language's, so the selector picks its flag
   * icon off the region half of this rather than off `code` directly.
   */
  readonly regionTag: string;
}

export const LOCALE_OPTIONS: readonly LocaleOption[] = [
  { code: 'en', label: 'English', shortLabel: 'EN', regionTag: 'en-US' },
  { code: 'de', label: 'Deutsch', shortLabel: 'DE', regionTag: 'de-DE' },
  { code: 'th', label: 'ไทย', shortLabel: 'TH', regionTag: 'th-TH' },
];

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

/**
 * The supported locale a BCP 47 tag asks for, by its primary subtag: `de-AT` is
 * served German, `th-TH-u-nu-thai` Thai. Unsupported languages return null.
 */
export function matchLocaleTag(tag: string | null | undefined): SupportedLocale | null {
  const primary = tag?.toLowerCase().split('-')[0];
  return isSupportedLocale(primary) ? primary : null;
}

/**
 * An explicit choice wins; otherwise the first of the browser's languages the site
 * is built in; otherwise English.
 */
export function resolvePreferredLocale(
  stored: string | null | undefined,
  browserTags: readonly string[] = [],
): SupportedLocale {
  if (isSupportedLocale(stored)) return stored;

  for (const tag of browserTags) {
    const matched = matchLocaleTag(tag);
    if (matched) return matched;
  }

  return DEFAULT_LOCALE;
}

/** The parts of `window.location` a locale switch needs. */
export interface LocationParts {
  readonly pathname: string;
  readonly search: string;
  readonly hash: string;
}

/**
 * The same page in `target`: the locale segment of the current base href is swapped,
 * and the route, query and fragment after it are carried over. A path outside the
 * base href (nothing the router owns) lands on the target locale's home page.
 */
export function localeSwitchUrl(
  target: SupportedLocale,
  baseHref: string,
  location: LocationParts,
): string {
  const prefix = baseHref.replace(/[a-z-]+\/$/, '');
  const targetBase = `${prefix}${target}/`;
  const route = location.pathname.startsWith(baseHref)
    ? location.pathname.slice(baseHref.length)
    : '';

  return `${targetBase}${route}${location.search}${location.hash}`;
}
