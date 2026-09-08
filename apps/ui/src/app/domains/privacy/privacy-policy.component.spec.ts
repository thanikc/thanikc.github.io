import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { PrivacyPolicyComponent } from './privacy-policy.component';
import { CookieConsentService } from '../../shared/cookie-consent/cookie-consent.service';

// Tailwind palette utilities are frozen to one hex value and ignore the theme
// toggle; themed colour must come from the `--mat-sys-*` tokens instead.
const PALETTE_CLASS =
  /^(?:(?:hover|focus|focus-visible|active|dark|sm|md|lg):)*(?:bg|text|border|ring|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d{2,3})?(?:\/\d+)?$/;

const paletteClassesIn = (root: Element): string[] =>
  [root, ...root.querySelectorAll('*')].flatMap(el =>
    [...el.classList].filter(c => PALETTE_CLASS.test(c)),
  );

describe('PrivacyPolicyComponent', () => {
  let component: PrivacyPolicyComponent;
  let fixture: ComponentFixture<PrivacyPolicyComponent>;

  const mockCookieConsentService = {
    resetChoice: vi.fn(),
  };

  const compiled = () => fixture.nativeElement as HTMLElement;
  const headings = (selector: string) =>
    [...compiled().querySelectorAll(selector)].map(el => el.textContent?.trim());

  beforeEach(async () => {
    mockCookieConsentService.resetChoice.mockClear();

    await TestBed.configureTestingModule({
      imports: [PrivacyPolicyComponent],
      providers: [{ provide: CookieConsentService, useValue: mockCookieConsentService }],
    }).compileComponents();

    fixture = TestBed.createComponent(PrivacyPolicyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeDefined();
  });

  it('renders a single h1 titled "Privacy Policy"', () => {
    const h1s = compiled().querySelectorAll('h1');

    expect(h1s.length).toBe(1);
    expect(h1s[0].textContent?.trim()).toBe('Privacy Policy');
  });

  it('covers the GDPR-required disclosures as section headings', () => {
    const h2Text = headings('h2').join(' | ');

    expect(h2Text).toContain('Who We Are');
    expect(h2Text).toContain('Cookies');
    expect(h2Text).toContain('Google Fonts');
    expect(h2Text).toContain('Google Analytics');
    expect(h2Text).toContain('Google AdSense');
    expect(h2Text).toContain('International Data Transfers');
    expect(h2Text).toContain('Your Rights');
  });

  it('lists the data subject rights guaranteed by the GDPR', () => {
    const bodyText = compiled().textContent ?? '';

    for (const right of [
      'access',
      'rectification',
      'erasure',
      'restriction',
      'portable',
      'object',
      'withdraw consent',
      'supervisory authority',
    ]) {
      expect(bodyText.toLowerCase()).toContain(right);
    }
  });

  it('provides a mailto contact link for exercising data subject rights', () => {
    const mailtoLink = compiled().querySelector('a[href^="mailto:"]');

    expect(mailtoLink).not.toBeNull();
    expect(mailtoLink?.getAttribute('href')).toBe('mailto:thanikc@gmail.com');
  });

  it('opens third-party policy links safely in a new tab', () => {
    const externalLinks = [...compiled().querySelectorAll<HTMLAnchorElement>('a[href^="http"]')];

    expect(externalLinks.length).toBeGreaterThan(0);
    for (const link of externalLinks) {
      expect(link.getAttribute('target')).toBe('_blank');
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    }
  });

  it('lets the user reopen the cookie banner via the consent service', () => {
    const button = [...compiled().querySelectorAll('button')].find(btn =>
      btn.textContent?.includes('Manage Cookie Preferences'),
    );

    expect(button).toBeDefined();
    button!.click();

    expect(mockCookieConsentService.resetChoice).toHaveBeenCalled();
  });

  it('does not repeat the page gutters already applied by <main>', () => {
    const page = compiled().querySelector('.policy-page');

    expect(page?.classList.contains('container')).toBe(false);
    expect(page?.classList.contains('px-4')).toBe(false);
    expect(page?.classList.contains('max-w-6xl')).toBe(false);
  });

  it('colours the page from theme tokens, not the Tailwind palette', () => {
    expect(paletteClassesIn(compiled())).toEqual([]);
  });
});
