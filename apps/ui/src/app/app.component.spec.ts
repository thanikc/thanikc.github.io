import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideRouter } from '@angular/router';

// Tailwind palette utilities are frozen to one hex value and ignore the theme
// toggle; themed colour must come from the `--mat-sys-*` tokens instead.
const PALETTE_CLASS =
  /^(?:(?:hover|focus|focus-visible|active|dark|sm|md|lg):)*(?:bg|text|border|ring|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d{2,3})?(?:\/\d+)?$/;

const paletteClassesIn = (root: Element): string[] =>
  [root, ...root.querySelectorAll('*')].flatMap(el =>
    [...el.classList].filter(c => PALETTE_CLASS.test(c)),
  );

describe('AppComponent', () => {
  let component: AppComponent;
  let fixture: ComponentFixture<AppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(AppComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the app shell', () => {
    expect(component).toBeTruthy();
  });

  it('should render the header component', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-header')).not.toBeNull();
  });

  it('should contain a main router outlet for lazy loaded views', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });

  // Tailwind's `dark:` variant keys off the OS `prefers-color-scheme`, while the
  // theme toggle keys off `data-theme`. A hardcoded text colour on the shell
  // therefore follows the OS while the background follows the toggle, and the two
  // collapse to the same tone when they disagree. Inherit the theme-aware
  // `--mat-sys-on-surface` from `body` instead.
  it('should not pin the shell text colour to a palette that ignores the theme toggle', () => {
    const shell = (fixture.nativeElement as HTMLElement).querySelector('.app-shell');
    const classes = Array.from(shell!.classList);

    expect(classes.filter(c => /^(dark:)?text-slate-/.test(c))).toEqual([]);
  });

  it('should colour the skip link from theme tokens, not the Tailwind palette', () => {
    const skipLink = (fixture.nativeElement as HTMLElement).querySelector(
      'a[href="#main-content"]',
    );

    expect(skipLink).not.toBeNull();
    expect(paletteClassesIn(skipLink!)).toEqual([]);
  });

  // The skip link focuses <main> programmatically. Suppressing its outline left
  // keyboard users with no indication of where focus landed, and without a
  // scroll margin the sticky header covered the top of the target.
  it('should keep the skip-link target visible below the sticky header', () => {
    const main = (fixture.nativeElement as HTMLElement).querySelector('main');

    expect(main?.classList.contains('focus:outline-none')).toBe(false);
    expect([...main!.classList].some(c => /^scroll-mt-/.test(c))).toBe(true);
  });
});
