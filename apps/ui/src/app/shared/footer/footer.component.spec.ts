import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { FooterComponent } from './footer.component';

// Tailwind palette utilities are frozen to one hex value and ignore the theme
// toggle; themed colour must come from the `--mat-sys-*` tokens instead.
const PALETTE_CLASS =
  /^(?:(?:hover|focus|focus-visible|active|dark|sm|md|lg):)*(?:bg|text|border|ring|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d{2,3})?(?:\/\d+)?$/;

const paletteClassesIn = (root: Element): string[] =>
  [root, ...root.querySelectorAll('*')].flatMap(el =>
    [...el.classList].filter(c => PALETTE_CLASS.test(c)),
  );

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  const el = () => fixture.nativeElement as HTMLElement;
  const footer = () => el().querySelector('footer')!;
  const contactLinks = () => [...footer().querySelectorAll<HTMLAnchorElement>('.footer-contact a')];
  const linkFor = (label: string) =>
    contactLinks().find(link => link.getAttribute('data-cta-tracking') === label);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
      providers: [provideRouter([])], // Provides Router & ActivatedRoute for AdBannerService
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the footer component', () => {
    expect(component).toBeTruthy();
  });

  // The header's "Contact" link jumps to the footer, clear of the sticky header.
  it('is the #contact target for the header navigation', () => {
    expect(footer().id).toBe('contact');
    expect(footer().classList.contains('scroll-mt-24')).toBe(true);
  });

  // Dark full-bleed section closing on the giant brand wordmark
  // (the same drawn svg as the header, named for a11y by its own aria-label).
  describe('dark full-bleed section', () => {
    it('is a full-bleed dark section', () => {
      expect(footer().classList.contains('footer-section')).toBe(true);
    });

    it('closes on the giant brand wordmark, drawn as svg not an image', () => {
      const wordmark = footer().querySelector('.footer-wordmark');
      const svg = wordmark?.querySelector('svg');

      expect(wordmark?.tagName).toBe('APP-BRAND-MARK');
      expect(footer().querySelector('img')).toBeNull();
      expect(svg?.getAttribute('aria-label')).toBe('thanikc');
    });
  });

  // Closing statement + CTA button, reusing existing copy —
  // the note already said this; nothing new is invented.
  describe('closing statement and CTA', () => {
    it('states in one line how the site is built', () => {
      const note = footer().querySelector('.footer-note');

      expect(note?.textContent).toContain('real but low-stakes');
      expect(note?.textContent).toContain('test-first');
    });

    it('offers a primary CTA that emails Thanik', () => {
      const cta = footer().querySelector<HTMLAnchorElement>('.footer-cta');

      expect(cta?.getAttribute('href')).toBe('mailto:thanikc@gmail.com');
      expect(cta?.classList.contains('min-h-11')).toBe(true);
    });

    it('invites a conversation, with a decorative right arrow', () => {
      const cta = footer().querySelector<HTMLAnchorElement>('.footer-cta');

      expect(cta?.textContent).toContain('Start a conversation');
      expect(cta?.querySelector('mat-icon')?.textContent?.trim()).toBe('arrow_forward');
      expect(cta?.querySelector('mat-icon')?.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // 3-column nav — about / site nav / contact — reusing the
  // header's own nav links and the existing social/contact links.
  describe('three-column nav', () => {
    it('names the site in the first column', () => {
      const about = footer().querySelector('.footer-about');

      expect(about?.textContent).toContain('Thanik Cheowtirakul');
    });

    it('summarises the page in one sentence under the name', () => {
      const summary = footer().querySelector('.footer-about-summary');

      expect(summary?.textContent).toContain('full-stack engineer');
      expect(summary?.textContent?.match(/[.!?]/g)).toHaveLength(1);
    });

    it('reuses the header’s nav links, minus Contact (the footer is its target), plus Privacy Policy in the nav column', () => {
      const links = [...footer().querySelectorAll<HTMLAnchorElement>('.footer-nav a')].map(a =>
        a.textContent?.trim(),
      );

      expect(links).toEqual(['Work', 'Projects', 'Privacy Policy']);
    });

    it('links Work and Projects to their sections on the home page', () => {
      const links = [...footer().querySelectorAll<HTMLAnchorElement>('.footer-nav a')];

      expect(links.slice(0, 2).map(a => a.getAttribute('href'))).toEqual([
        '/#work-heading',
        '/#projects-heading',
      ]);
    });

    it('links to the privacy policy as an in-app route', () => {
      const privacyLink = [...footer().querySelectorAll<HTMLAnchorElement>('.footer-nav a')].find(
        link => link.textContent?.trim() === 'Privacy Policy',
      );

      expect(privacyLink?.getAttribute('href')).toBe('/privacy-policy');
      expect(privacyLink?.getAttribute('target')).toBeNull();
    });

    // Icons alone made visitors guess; each link now says where it goes.
    it('renders exactly one tracked, labelled contact link each for Email, GitHub, and LinkedIn', () => {
      expect(contactLinks().length).toBe(3);

      for (const [label, text] of [
        ['Email', 'Email'],
        ['GitHub Repository', 'GitHub'],
        ['LinkedIn', 'LinkedIn'],
      ]) {
        const link = linkFor(label);
        expect(link, `expected a link tracked as "${label}"`).toBeDefined();
        expect(link!.textContent?.trim()).toBe(text);
        expect(link!.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
      }
    });

    // WCAG 2.5.3 Label in Name: the accessible name must contain the visible text.
    it('keeps each visible contact-link label inside its accessible name', () => {
      for (const link of contactLinks()) {
        expect(link.getAttribute('aria-label')).toContain(link.textContent!.trim());
      }
    });

    it('links Email to a mailto address with no target attribute', () => {
      const link = linkFor('Email');

      expect(link?.getAttribute('href')).toBe('mailto:thanikc@gmail.com');
      expect(link?.getAttribute('target')).toBeNull();
    });

    it('opens GitHub and LinkedIn in a new tab with secure rel attributes', () => {
      for (const label of ['GitHub Repository', 'LinkedIn']) {
        const link = linkFor(label);

        expect(link?.getAttribute('target')).toBe('_blank');
        expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
      }
    });

    it('links GitHub Repository to the repo and LinkedIn to the profile', () => {
      expect(linkFor('GitHub Repository')?.getAttribute('href')).toBe(
        'https://github.com/thanikc/thanikc.github.io',
      );
      expect(linkFor('LinkedIn')?.getAttribute('href')).toBe(
        'https://de.linkedin.com/in/thanik-cheowtirakul-7a259526',
      );
    });

    it('gives every nav and contact link a 44px minimum hit area', () => {
      for (const link of [
        ...footer().querySelectorAll<HTMLAnchorElement>('.footer-nav a'),
        ...contactLinks(),
      ]) {
        expect(link.classList.contains('min-h-11')).toBe(true);
      }
    });
  });

  it('should carry the footer note as plain text, without an icon', () => {
    expect(footer().querySelector('.footer-note mat-icon')).toBeNull();
  });

  // Ads are currently deactivated site-wide (AdBannerService.adsEnabled); a
  // toggle for a feature that's globally off would just confuse visitors.
  it('should not render the ad banner toggle while ads are globally disabled', () => {
    expect(footer().querySelector('app-ad-banner-toggle')).toBeNull();
  });

  it('should colour itself from theme tokens, not the Tailwind palette', () => {
    expect(paletteClassesIn(footer())).toEqual([]);
  });
});
