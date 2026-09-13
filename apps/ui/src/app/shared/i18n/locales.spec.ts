import {
  DEFAULT_LOCALE,
  LOCALE_OPTIONS,
  SUPPORTED_LOCALES,
  isSupportedLocale,
  localeSwitchUrl,
  matchLocaleTag,
  resolvePreferredLocale,
} from './locales';

describe('supported locales', () => {
  it('offers English, German and Thai with English as the fallback', () => {
    expect(SUPPORTED_LOCALES).toEqual(['en', 'de', 'th']);
    expect(DEFAULT_LOCALE).toBe('en');
  });

  it('names every locale in its own language', () => {
    expect(LOCALE_OPTIONS.map(option => option.code)).toEqual([...SUPPORTED_LOCALES]);
    expect(LOCALE_OPTIONS.map(option => option.label)).toEqual(['English', 'Deutsch', 'ไทย']);
    expect(LOCALE_OPTIONS.map(option => option.shortLabel)).toEqual(['EN', 'DE', 'TH']);
    expect(LOCALE_OPTIONS.map(option => option.regionTag)).toEqual(['en-US', 'de-DE', 'th-TH']);
  });

  it('recognises supported codes only', () => {
    expect(isSupportedLocale('de')).toBe(true);
    expect(isSupportedLocale('fr')).toBe(false);
    expect(isSupportedLocale(null)).toBe(false);
  });
});

describe('matchLocaleTag', () => {
  it('matches a bare code', () => {
    expect(matchLocaleTag('th')).toBe('th');
  });

  it('matches the primary subtag of a regional tag', () => {
    expect(matchLocaleTag('de-AT')).toBe('de');
    expect(matchLocaleTag('en-GB')).toBe('en');
    expect(matchLocaleTag('th-TH-u-nu-thai')).toBe('th');
  });

  it('ignores case', () => {
    expect(matchLocaleTag('DE')).toBe('de');
  });

  it('returns null for unsupported or empty tags', () => {
    expect(matchLocaleTag('fr-FR')).toBeNull();
    expect(matchLocaleTag('')).toBeNull();
    expect(matchLocaleTag(undefined)).toBeNull();
  });
});

describe('resolvePreferredLocale', () => {
  it('prefers a stored choice over the browser languages', () => {
    expect(resolvePreferredLocale('th', ['de-DE', 'en'])).toBe('th');
  });

  it('falls back to the browser languages when nothing is stored', () => {
    expect(resolvePreferredLocale(null, ['de-DE', 'en'])).toBe('de');
  });

  it('takes the first browser language that is supported', () => {
    expect(resolvePreferredLocale(null, ['fr-FR', 'it', 'th-TH'])).toBe('th');
  });

  it('ignores a stored value that is no longer supported', () => {
    expect(resolvePreferredLocale('fr', ['de'])).toBe('de');
  });

  it('falls back to English when nothing matches', () => {
    expect(resolvePreferredLocale(null, ['fr-FR', 'ja'])).toBe('en');
    expect(resolvePreferredLocale(null, [])).toBe('en');
  });
});

describe('localeSwitchUrl', () => {
  const at = (pathname: string, search = '', hash = '') => ({ pathname, search, hash });

  it('swaps the locale segment of the current path', () => {
    expect(localeSwitchUrl('th', '/de/', at('/de/calculator'))).toBe('/th/calculator');
  });

  it('keeps the query string and fragment', () => {
    expect(localeSwitchUrl('de', '/en/', at('/en/', '?ref=cv', '#contact'))).toBe(
      '/de/?ref=cv#contact',
    );
  });

  it('lands on the locale home page when the path is just the locale root', () => {
    expect(localeSwitchUrl('de', '/en/', at('/en/'))).toBe('/de/');
  });

  it('preserves a deployment prefix in front of the locale segment', () => {
    expect(localeSwitchUrl('th', '/site/de/', at('/site/de/privacy-policy'))).toBe(
      '/site/th/privacy-policy',
    );
  });

  it('falls back to the locale home page when the path is outside the base href', () => {
    expect(localeSwitchUrl('th', '/en/', at('/somewhere-else'))).toBe('/th/');
  });
});
