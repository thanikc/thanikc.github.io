import { LOCALE_ID } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { LOCALE_STORAGE_KEY, LOCALE_OPTIONS } from './locales';
import { LocaleService } from './locale.service';

interface Harness {
  service: LocaleService;
  assign: ReturnType<typeof vi.fn>;
  setItem: ReturnType<typeof vi.fn>;
}

function setup(options?: {
  locale?: string;
  baseURI?: string;
  pathname?: string;
  search?: string;
  hash?: string;
  storageThrows?: boolean;
  headless?: boolean;
}): Harness {
  const assign = vi.fn();
  const setItem = vi.fn(() => {
    if (options?.storageThrows) throw new Error('storage disabled');
  });

  const view = {
    location: {
      pathname: options?.pathname ?? '/en/',
      search: options?.search ?? '',
      hash: options?.hash ?? '',
      assign,
    },
    localStorage: { setItem, getItem: vi.fn(() => null) },
  };

  const baseURI = options?.baseURI ?? 'https://thanikc.github.io/en/';
  const baseHref = new URL(baseURI).pathname;

  const document = {
    baseURI,
    defaultView: options?.headless ? null : view,
    querySelector: (selector: string) =>
      selector === 'base' ? { getAttribute: () => baseHref } : null,
  } as unknown as Document;

  TestBed.configureTestingModule({
    providers: [
      { provide: DOCUMENT, useValue: document },
      { provide: LOCALE_ID, useValue: options?.locale ?? 'en' },
    ],
  });

  return { service: TestBed.inject(LocaleService), assign, setItem };
}

describe('LocaleService', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('reports the locale the bundle was built for', () => {
    expect(setup({ locale: 'de' }).service.current).toBe('de');
  });

  it('normalises a regional build locale to its language', () => {
    expect(setup({ locale: 'en-US' }).service.current).toBe('en');
  });

  it('falls back to English for a locale it has no bundle for', () => {
    expect(setup({ locale: 'fr' }).service.current).toBe('en');
  });

  it('exposes the selectable languages and the active one', () => {
    const { service } = setup({ locale: 'th' });

    expect(service.options).toEqual(LOCALE_OPTIONS);
    expect(service.currentOption.label).toBe('ไทย');
  });

  it('remembers the choice and navigates to the same page in the new language', () => {
    const { service, assign, setItem } = setup({
      locale: 'de',
      baseURI: 'https://thanikc.github.io/de/',
      pathname: '/de/calculator',
      search: '?ref=cv',
      hash: '#contact',
    });

    service.switchTo('th');

    expect(setItem).toHaveBeenCalledWith(LOCALE_STORAGE_KEY, 'th');
    expect(assign).toHaveBeenCalledWith('/th/calculator?ref=cv#contact');
  });

  it('does nothing when the chosen language is already active', () => {
    const { service, assign, setItem } = setup({ locale: 'en' });

    service.switchTo('en');

    expect(setItem).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });

  it('still navigates when storage is unavailable', () => {
    const { service, assign } = setup({ storageThrows: true });

    service.switchTo('de');

    expect(assign).toHaveBeenCalledWith('/de/');
  });

  it('is inert while prerendering, where there is no window', () => {
    const { service } = setup({ headless: true });

    expect(() => service.switchTo('de')).not.toThrow();
  });

  it('can switch when served from its own locale subpath, as the deployed build is', () => {
    expect(
      setup({ locale: 'de', baseURI: 'https://thanikc.github.io/de/' }).service.canSwitchLocale,
    ).toBe(true);
  });

  it('cannot switch when served from the plain root, as ng serve and ng test do', () => {
    expect(setup({ locale: 'en', baseURI: 'http://localhost:4200/' }).service.canSwitchLocale).toBe(
      false,
    );
  });

  it('does nothing when the build cannot switch languages, even if asked to', () => {
    const { service, assign, setItem } = setup({
      locale: 'en',
      baseURI: 'http://localhost:4200/',
    });

    service.switchTo('de');

    expect(setItem).not.toHaveBeenCalled();
    expect(assign).not.toHaveBeenCalled();
  });
});
