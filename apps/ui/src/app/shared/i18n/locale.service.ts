import { Injectable, LOCALE_ID, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import {
  DEFAULT_LOCALE,
  LOCALE_OPTIONS,
  LOCALE_STORAGE_KEY,
  LocaleOption,
  SupportedLocale,
  localeSwitchUrl,
  matchLocaleTag,
} from './locales';

/**
 * The active language, and the one operation that changes it.
 *
 * Each locale is its own build served from its own subpath, so `current` is fixed for
 * the lifetime of the document and switching is a full navigation to the sibling
 * bundle — there is no runtime language state to keep in a signal. The choice is
 * written to local storage first so the redirect page at the deployment root
 * (`scripts/emit-pages-root.mjs`) sends the visitor straight here next time.
 */
@Injectable({ providedIn: 'root' })
export class LocaleService {
  private readonly document = inject(DOCUMENT);

  /** The locale this bundle was compiled for, as one of the locales the site is built in. */
  readonly current: SupportedLocale = matchLocaleTag(inject(LOCALE_ID)) ?? DEFAULT_LOCALE;

  readonly options = LOCALE_OPTIONS;

  readonly currentOption: LocaleOption =
    LOCALE_OPTIONS.find(option => option.code === this.current) ?? LOCALE_OPTIONS[0];

  /**
   * A sibling locale bundle only exists to navigate to once the site is deployed:
   * `ng serve` and `ng test` compile English alone and serve it from the plain root
   * (see `AGENTS.md`), so a switch there would bounce off a route the router doesn't
   * recognise and land back on English. Detected rather than configured, so it needs
   * no wiring beyond what `angular.json` already sets per environment.
   *
   * Read straight off the `<base>` element rather than `document.baseURI`: this runs
   * during prerendering too, and domino (the DOM `platform-server` renders against)
   * has no `baseURI` getter.
   */
  readonly canSwitchLocale: boolean =
    this.document.querySelector('base')?.getAttribute('href') === `/${this.current}/`;

  switchTo(locale: SupportedLocale): void {
    if (locale === this.current || !this.canSwitchLocale) return;

    const view = this.document.defaultView;
    if (!view) return;

    this.remember(view, locale);
    view.location.assign(
      localeSwitchUrl(locale, new URL(this.document.baseURI).pathname, view.location),
    );
  }

  /** A blocked or full local storage must not cost the visitor the language they asked for. */
  private remember(view: Window, locale: SupportedLocale): void {
    try {
      view.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      // Ignored: the switch itself still works, it just isn't remembered.
    }
  }
}
