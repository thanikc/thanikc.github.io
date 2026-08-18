import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { CookieConsentBannerComponent } from './cookie-consent-banner.component';
import { CookieConsentService } from './cookie-consent.service';

// Tailwind palette utilities are frozen to one hex value and ignore the theme
// toggle; themed colour must come from the `--mat-sys-*` tokens instead.
const PALETTE_CLASS =
  /^(?:(?:hover|focus|focus-visible|active|dark|sm|md|lg):)*(?:bg|text|border|ring|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d{2,3})?(?:\/\d+)?$/;

const paletteClassesIn = (root: Element): string[] =>
  [root, ...root.querySelectorAll('*')].flatMap(el =>
    [...el.classList].filter(c => PALETTE_CLASS.test(c)),
  );

describe('CookieConsentBannerComponent', () => {
  let component: CookieConsentBannerComponent;
  let fixture: ComponentFixture<CookieConsentBannerComponent>;

  const banner = () =>
    (fixture.nativeElement as HTMLElement).querySelector('[role="region"]') as HTMLElement | null;
  const buttons = () => [
    ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>('button'),
  ];

  const mockShowBanner = signal(true);
  const mockCookieConsentService = {
    showBanner: mockShowBanner,
    accept: vi.fn(),
    reject: vi.fn(),
  };

  beforeEach(async () => {
    mockShowBanner.set(true);
    mockCookieConsentService.accept.mockClear();
    mockCookieConsentService.reject.mockClear();

    await TestBed.configureTestingModule({
      imports: [CookieConsentBannerComponent],
      providers: [{ provide: CookieConsentService, useValue: mockCookieConsentService }],
    }).compileComponents();

    fixture = TestBed.createComponent(CookieConsentBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the banner when showBanner is true', () => {
    expect(banner()).not.toBeNull();
  });

  it('hides the banner when showBanner is false', () => {
    mockShowBanner.set(false);
    fixture.detectChanges();

    expect(banner()).toBeNull();
  });

  // A persistent notice is not a modal: `role="dialog"` promises focus
  // management and an escape route that this banner never provided.
  it('exposes the banner as a labelled region, not a dialog', () => {
    expect(banner()?.getAttribute('aria-label')).toBe('Cookie consent');
    expect((fixture.nativeElement as HTMLElement).querySelector('[role="dialog"]')).toBeNull();
  });

  it('uses Angular Material buttons rather than hand-rolled ones', () => {
    expect(buttons().length).toBe(2);

    for (const button of buttons()) {
      expect(button.classList.contains('mat-mdc-button-base')).toBe(true);
    }
  });

  // Material buttons are 40px tall at density 0, just under the 44px minimum.
  it('gives both buttons a 44px minimum hit area', () => {
    for (const button of buttons()) {
      expect(button.classList.contains('min-h-11')).toBe(true);
    }
  });

  it('colours the banner from theme tokens, not the Tailwind palette', () => {
    expect(paletteClassesIn(banner()!)).toEqual([]);
  });

  it('calls accept() on the service when the Accept button is clicked', () => {
    buttons()[1].click();

    expect(mockCookieConsentService.accept).toHaveBeenCalled();
  });

  it('calls reject() on the service when the Reject button is clicked', () => {
    buttons()[0].click();

    expect(mockCookieConsentService.reject).toHaveBeenCalled();
  });
});
