import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

  const links = () => [
    ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLAnchorElement>('footer a'),
  ];
  const linkFor = (label: string) =>
    links().find(link => link.getAttribute('data-cta-tracking') === label);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FooterComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FooterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the footer component', () => {
    expect(component).toBeTruthy();
  });

  it('should render a <footer> element', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('footer')).not.toBeNull();
  });

  it('should match the horizontal padding and max-width of <main>', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const footer = compiled.querySelector('footer');

    expect(footer?.classList.contains('container')).toBe(true);
    expect(footer?.classList.contains('mx-auto')).toBe(true);
    expect(footer?.classList.contains('px-4')).toBe(true);
    expect(footer?.classList.contains('max-w-6xl')).toBe(true);
  });

  it('should right-align the links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('footer')?.classList.contains('justify-end')).toBe(true);
  });

  it('should render exactly one tracked, icon-only link each for Email, GitHub, and LinkedIn', () => {
    expect(links().length).toBe(3);

    for (const label of ['Email', 'GitHub Repository', 'LinkedIn']) {
      const link = linkFor(label);
      expect(link, `expected a link tracked as "${label}"`).toBeDefined();
      expect(link!.textContent?.trim()).toBe('');
      expect(link!.querySelector('svg')).not.toBeNull();
    }
  });

  it('should link Email to a mailto address with no target attribute', () => {
    const link = linkFor('Email');

    expect(link?.getAttribute('href')).toBe('mailto:thanikc@gmail.com');
    expect(link?.getAttribute('target')).toBeNull();
  });

  it('should open GitHub and LinkedIn in a new tab with secure rel attributes', () => {
    for (const label of ['GitHub Repository', 'LinkedIn']) {
      const link = linkFor(label);

      expect(link?.getAttribute('target')).toBe('_blank');
      expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
    }
  });

  it('should link GitHub Repository to the repo and LinkedIn to the profile', () => {
    expect(linkFor('GitHub Repository')?.getAttribute('href')).toBe(
      'https://github.com/thanikc/thanikc.github.io',
    );
    expect(linkFor('LinkedIn')?.getAttribute('href')).toBe(
      'https://de.linkedin.com/in/thanik-cheowtirakul-7a259526',
    );
  });
});
