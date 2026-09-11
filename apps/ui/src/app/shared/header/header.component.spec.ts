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

  // The page is about a person: the header names him, not a generic "Dev Info".
  it('should render the brand link to the home route with the name', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const brandLink = compiled.querySelector('.brand-link');

    expect(brandLink?.getAttribute('href')).toBe('/');
    expect(brandLink?.textContent).toContain('Thanik Cheowtirakul');
    expect(brandLink?.textContent).not.toContain('Dev Info');
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

    // Name, three links and the theme toggle don't fit 360px; phones scroll instead.
    it('hides below the sm breakpoint', () => {
      expect(nav()?.classList.contains('hidden')).toBe(true);
      expect(nav()?.classList.contains('sm:flex')).toBe(true);
    });
  });

  it('should render the theme toggle', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-theme-toggle')).not.toBeNull();
  });

  // Header, <main> and the footer share one content column; a wider header made
  // the brand mark hang outside the page content on large screens.
  it('should align the header content with the main content column', () => {
    const container = (fixture.nativeElement as HTMLElement).querySelector('.header-container');

    expect(container?.classList.contains('max-w-6xl')).toBe(true);
  });
});
