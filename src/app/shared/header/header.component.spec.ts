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

  it('should render the application title in the toolbar', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const titleEl = compiled.querySelector('.app-title') || compiled.querySelector('mat-toolbar');

    expect(titleEl?.textContent).toBeTruthy();
  });

  it('should render navigation links with correct routerLinks', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = compiled.querySelectorAll('a[routerLink]');

    expect(navLinks.length).toBeGreaterThan(0);
  });

  it('should meet accessibility standard with an explicit nav landmark', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const navElement = compiled.querySelector('nav');

    expect(navElement).not.toBeNull();
    expect(navElement?.getAttribute('aria-label')).toBeTruthy();
  });
});
