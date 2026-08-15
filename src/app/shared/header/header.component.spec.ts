import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { HeaderComponent } from './header.component';
import { NAV_LINKS } from './nav-links';

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

  it('should render the application title in the toolbar', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const titleEl = compiled.querySelector('.app-title') || compiled.querySelector('mat-toolbar');

    expect(titleEl?.textContent).toBeTruthy();
  });

  it('should render one navigation link per configured nav entry', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = compiled.querySelectorAll('nav a[href]');

    expect(navLinks.length).toBe(NAV_LINKS.length);
    expect([...navLinks].map(link => link.getAttribute('href'))).toEqual(
      NAV_LINKS.map(link => link.path),
    );
  });

  it('should meet accessibility standard with an explicit nav landmark', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navElement = compiled.querySelector('nav');

    expect(navElement).not.toBeNull();
    expect(navElement?.getAttribute('aria-label')).toBeTruthy();
  });
});
