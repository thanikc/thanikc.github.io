import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrandMarkComponent } from './brand-mark.component';

describe('BrandMarkComponent', () => {
  let fixture: ComponentFixture<BrandMarkComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [BrandMarkComponent] });
    fixture = TestBed.createComponent(BrandMarkComponent);
    fixture.detectChanges();
  });

  // Glyphs are paths, not text: the accessible name comes from the SVG itself.
  it('renders the "thanikc" wordmark as a labelled, currentColor svg', () => {
    const svg = (fixture.nativeElement as HTMLElement).querySelector('svg');

    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')).toBe('thanikc');
    expect(svg?.getAttribute('fill')).toBe('currentColor');
    expect(svg?.querySelectorAll('path').length).toBeGreaterThan(0);
  });
});
