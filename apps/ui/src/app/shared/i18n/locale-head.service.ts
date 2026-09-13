import { Injectable, LOCALE_ID, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, SupportedLocale, matchLocaleTag } from './locales';

/** Where the built site is served from; the canonical URLs have to be absolute. */
const SITE_ORIGIN = 'https://thanikc.github.io';

/** Open Graph wants language_TERRITORY, not a bare language code. */
const OG_LOCALES: Record<SupportedLocale, string> = {
  en: 'en_US',
  de: 'de_DE',
  th: 'th_TH',
};

/**
 * Keeps the canonical URL, the `hreflang` alternates and the localized page metadata
 * in step with the route, so a crawler that finds one language of a page can find the
 * other two, and so a link shared from the German site does not preview in English.
 *
 * Every locale is a separate build at its own subpath, and all three prerender the
 * same routes — without these links the three copies of each page look like
 * duplicates. Written from the app rather than baked into `index.html` because the
 * URLs are per route, and prerendering runs this code: the static HTML of every
 * route ships with its own correct set.
 */
@Injectable({ providedIn: 'root' })
export class LocaleHeadService {
  private readonly document = inject(DOCUMENT);
  private readonly current: SupportedLocale = matchLocaleTag(inject(LOCALE_ID)) ?? DEFAULT_LOCALE;

  update(routerUrl: string): void {
    const route = routerUrl.replace(/[?#].*$/, '').replace(/^\/+/, '');
    const canonical = this.urlFor(this.current, route);

    this.setLink('canonical', 'canonical', canonical);

    for (const locale of SUPPORTED_LOCALES) {
      this.setAlternate(locale, this.urlFor(locale, route));
    }
    // For a language this site is not built in, English is the page to serve.
    this.setAlternate('x-default', this.urlFor(DEFAULT_LOCALE, route));

    this.setMeta('og:url', canonical);
    this.setMeta('og:locale', OG_LOCALES[this.current]);

    const title = $localize`:Site title, used as the social-card title@@seo.siteTitle:Thanik Cheowtirakul — Full-stack engineer`;
    const description = $localize`:Site description for search results and social cards@@seo.siteDescription:Full-stack engineer building large Angular and Spring Boot applications for German online banking. Ask AI Ling, the assistant on the page, for the detail.`;
    const imageAlt = $localize`:Alt text of the social share image@@seo.imageAlt:Thanik Cheowtirakul, full-stack engineer: large Angular and Spring Boot applications for German online banking.`;

    this.setNamedMeta('description', description);
    this.setMeta('og:title', title);
    this.setMeta('og:description', description);
    this.setMeta('og:image:alt', imageAlt);
    this.setNamedMeta('twitter:title', title);
    this.setNamedMeta('twitter:description', description);
    this.setNamedMeta('twitter:image:alt', imageAlt);
  }

  private urlFor(locale: SupportedLocale, route: string): string {
    return `${SITE_ORIGIN}/${locale}/${route}`;
  }

  private setAlternate(hreflang: string, href: string): void {
    this.setLink(`alternate-${hreflang}`, 'alternate', href, hreflang);
  }

  /**
   * One tag per role, reused across navigations: `data-locale-link` marks the tags
   * this service owns so re-running it updates them instead of appending a second set.
   */
  private setLink(key: string, rel: string, href: string, hreflang?: string): void {
    const head = this.document.head;
    const existing = head.querySelector<HTMLLinkElement>(`link[data-locale-link="${key}"]`);
    const link = existing ?? this.document.createElement('link');

    link.setAttribute('data-locale-link', key);
    link.setAttribute('rel', rel);
    link.setAttribute('href', href);
    if (hreflang) link.setAttribute('hreflang', hreflang);

    if (!existing) head.appendChild(link);
  }

  /** Open Graph tags, addressed by `property`. */
  private setMeta(property: string, content: string): void {
    this.setMetaBy('property', property, content);
  }

  /** Everything else — the page description and the Twitter card — uses `name`. */
  private setNamedMeta(name: string, content: string): void {
    this.setMetaBy('name', name, content);
  }

  private setMetaBy(attribute: 'name' | 'property', key: string, content: string): void {
    const head = this.document.head;
    const existing = head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
    const meta = existing ?? this.document.createElement('meta');

    meta.setAttribute(attribute, key);
    meta.setAttribute('content', content);

    if (!existing) head.appendChild(meta);
  }
}
