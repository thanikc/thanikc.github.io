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

  it('should render the brand link to the home route', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const brandLink = compiled.querySelector('.brand-link');

    expect(brandLink?.getAttribute('href')).toBe('/');
    expect(brandLink?.textContent).toContain('Dev Info');
  });

  it('should render the theme toggle', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('app-theme-toggle')).not.toBeNull();
  });
});
