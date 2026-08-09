import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FooterComponent } from './footer.component';

describe('FooterComponent', () => {
  let component: FooterComponent;
  let fixture: ComponentFixture<FooterComponent>;

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

  it('should contain a link to the LinkedIn profile', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a');

    expect(link).not.toBeNull();
    expect(link?.getAttribute('href')).toBe(
      'https://de.linkedin.com/in/thanik-cheowtirakul-7a259526',
    );
  });

  it('should open the link in a new tab with secure rel attributes', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const link = compiled.querySelector('a');

    expect(link?.getAttribute('target')).toBe('_blank');
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('should render an SVG icon inside the link', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const svg = compiled.querySelector('a svg');

    expect(svg).not.toBeNull();
  });
});
