import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { provideRouter } from '@angular/router';

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
});
