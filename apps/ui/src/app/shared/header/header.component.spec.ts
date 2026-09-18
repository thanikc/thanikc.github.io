import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HeaderComponent } from './header.component';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideRouter([])], // Provides Router & ActivatedRoute for routerLink directives
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the header component', () => {
    expect(component).toBeTruthy();
  });

  // The brand is a drawn wordmark, so its glyphs are paths, not text: the
  // accessible name has to come from the SVG's own role/label.
  it('should render the brand link to the home route as a "thanikc" wordmark', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const brandLink = compiled.querySelector('.brand-link');
    const mark = brandLink?.querySelector('app-brand-mark svg');

    expect(brandLink?.getAttribute('href')).toBe('/');
    expect(mark?.getAttribute('role')).toBe('img');
    expect(mark?.getAttribute('aria-label')).toBe('thanikc');
    expect(brandLink?.querySelector('img')).toBeNull();
  });

  describe('primary navigation', () => {
    const nav = () => (fixture.nativeElement as HTMLElement).querySelector('nav');
    const links = () => [...(nav()?.querySelectorAll<HTMLAnchorElement>('a') ?? [])];

    it('is a labelled nav landmark', () => {
      expect(nav()?.getAttribute('aria-label')).toBe('Primary');
    });

    // Fragment links on the home route, so they also work from the calculator page.
    it('links Work, Projects and Contact to their sections on the home page', () => {
      expect(links().map(a => a.textContent?.trim())).toEqual(['Work', 'Projects', 'Contact']);
      expect(links().map(a => a.getAttribute('href'))).toEqual([
        '/#work-heading',
        '/#projects-heading',
        '/#contact',
      ]);
    });

    it('gives every link a 44px hit area', () => {
      for (const link of links()) {
        expect(link.classList.contains('min-h-11')).toBe(true);
      }
    });

    // Name and three links don't fit 360px; phones scroll instead.
    it('hides below the sm breakpoint', () => {
      expect(nav()?.classList.contains('hidden')).toBe(true);
      expect(nav()?.classList.contains('sm:flex')).toBe(true);
    });

    // Nav typography: small uppercase letterspaced labels.
    it('sets every link in uppercase, letterspaced, small type', () => {
      for (const link of links()) {
        expect(link.classList.contains('uppercase')).toBe(true);
        expect(link.classList.contains('tracking-widest')).toBe(true);
        expect(link.classList.contains('text-xs')).toBe(true);
      }
    });

    it('styles every link alike, Contact included', () => {
      const [work, ...others] = links();

      for (const link of others) {
        expect(link.className).toBe(work.className);
      }
    });
  });

  describe('scroll state', () => {
    const header = () => (fixture.nativeElement as HTMLElement).querySelector('header');

    const setScrollY = (value: number) => {
      Object.defineProperty(window, 'scrollY', { configurable: true, value });
      window.dispatchEvent(new Event('scroll'));
      fixture.detectChanges();
    };

    afterEach(() => {
      setScrollY(0);
    });

    // At the very top the header floats transparent over the full-bleed dark hero.
    it('starts transparent at the top of the page', () => {
      expect(header()?.classList.contains('scrolled')).toBe(false);
    });

    // Past the hero, content behind the fixed header needs a solid backdrop to read.
    it('turns solid once the page scrolls down', () => {
      setScrollY(40);

      expect(header()?.classList.contains('scrolled')).toBe(true);
    });

    it('goes transparent again on scrolling back to the top', () => {
      setScrollY(40);
      setScrollY(0);

      expect(header()?.classList.contains('scrolled')).toBe(false);
    });
  });

  // Found by the Playwright design check: <mat-toolbar> alone is not a banner landmark.
  it('should wrap the toolbar in a <header> landmark', () => {
    const header = (fixture.nativeElement as HTMLElement).querySelector('header');

    expect(header).not.toBeNull();
    expect(header!.querySelector('mat-toolbar')).not.toBeNull();
  });

  // Found by the Playwright design check: the brand link was 28px tall.
  it('should give the brand link a 44px hit area', () => {
    const brandLink = (fixture.nativeElement as HTMLElement).querySelector('.brand-link');

    expect(brandLink?.classList.contains('min-h-11')).toBe(true);
  });

  // Found by the Playwright design check: nav links sat too close together.
  it('should keep 8px between the nav links', () => {
    const nav = (fixture.nativeElement as HTMLElement).querySelector('nav');

    expect(nav?.classList.contains('gap-2')).toBe(true);
  });

  // Header, <main> and the footer share one content column; a wider header made
  // the brand mark hang outside the page content on large screens.
  it('should align the header content with the main content column', () => {
    const container = (fixture.nativeElement as HTMLElement).querySelector('.header-container');

    expect(container?.classList.contains('max-w-6xl')).toBe(true);
  });

  describe('language selector', () => {
    const selector = () =>
      (fixture.nativeElement as HTMLElement).querySelector('app-language-selector');

    it('is offered in the header', () => {
      expect(selector()).not.toBeNull();
    });

    // The nav collapses below sm; changing language must not collapse with it,
    // since a visitor who cannot read the page needs it most on a phone.
    it('stays visible at every width', () => {
      expect(selector()?.closest('.hidden')).toBeNull();
    });
  });
});
