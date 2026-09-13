import { LOCALE_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { LocaleHeadService } from './locale-head.service';

describe('LocaleHeadService', () => {
  let document: Document;
  let service: LocaleHeadService;

  function setup(locale = 'en'): void {
    document = window.document.implementation.createHTMLDocument('test');
    TestBed.configureTestingModule({
      providers: [
        { provide: DOCUMENT, useValue: document },
        { provide: LOCALE_ID, useValue: locale },
      ],
    });
    service = TestBed.inject(LocaleHeadService);
  }

  const href = (selector: string) => document.head.querySelector(selector)?.getAttribute('href');
  const content = (selector: string) =>
    document.head.querySelector(selector)?.getAttribute('content');

  afterEach(() => TestBed.resetTestingModule());

  it('points the canonical URL at this locale copy of the route', () => {
    setup('de');

    service.update('/calculator');

    expect(href('link[rel="canonical"]')).toBe('https://thanikc.github.io/de/calculator');
  });

  it('uses the locale home page as the canonical URL of the root route', () => {
    setup('th');

    service.update('/');

    expect(href('link[rel="canonical"]')).toBe('https://thanikc.github.io/th/');
  });

  it('drops the query string and fragment', () => {
    setup('en');

    service.update('/?ref=cv#contact');

    expect(href('link[rel="canonical"]')).toBe('https://thanikc.github.io/en/');
  });

  it('declares every language of the same page, plus English as the fallback', () => {
    setup('de');

    service.update('/privacy-policy');

    const alternates = [...document.head.querySelectorAll('link[rel="alternate"]')].map(link => [
      link.getAttribute('hreflang'),
      link.getAttribute('href'),
    ]);

    expect(alternates).toEqual([
      ['en', 'https://thanikc.github.io/en/privacy-policy'],
      ['de', 'https://thanikc.github.io/de/privacy-policy'],
      ['th', 'https://thanikc.github.io/th/privacy-policy'],
      ['x-default', 'https://thanikc.github.io/en/privacy-policy'],
    ]);
  });

  it('keeps the Open Graph URL and locale in step with the canonical URL', () => {
    setup('th');

    service.update('/calculator');

    expect(content('meta[property="og:url"]')).toBe('https://thanikc.github.io/th/calculator');
    expect(content('meta[property="og:locale"]')).toBe('th_TH');
  });

  // index.html carries one English set for the no-script case; each locale build
  // replaces it with its own on the first navigation, prerendering included.
  it('states the page description and social titles in this language', () => {
    setup('en');

    service.update('/');

    expect(content('meta[name="description"]')).toContain('Full-stack engineer');
    expect(content('meta[property="og:title"]')).toBe('Thanik Cheowtirakul — Full-stack engineer');
    expect(content('meta[name="twitter:title"]')).toBe('Thanik Cheowtirakul — Full-stack engineer');
    expect(content('meta[property="og:description"]')).toBe(content('meta[name="description"]'));
    expect(content('meta[name="twitter:description"]')).toBe(content('meta[name="description"]'));
    expect(content('meta[property="og:image:alt"]')).toContain('Thanik Cheowtirakul');
    expect(content('meta[name="twitter:image:alt"]')).toContain('Thanik Cheowtirakul');
  });

  it('replaces the previous route links instead of piling them up', () => {
    setup('en');

    service.update('/calculator');
    service.update('/privacy-policy');

    expect(document.head.querySelectorAll('link[rel="canonical"]').length).toBe(1);
    expect(document.head.querySelectorAll('link[rel="alternate"]').length).toBe(4);
    expect(href('link[rel="canonical"]')).toBe('https://thanikc.github.io/en/privacy-policy');
  });
});
