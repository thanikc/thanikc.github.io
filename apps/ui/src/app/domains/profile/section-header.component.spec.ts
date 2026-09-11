import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SectionHeaderComponent } from './section-header.component';
import { paletteClassesIn } from '../../shared/testing/palette-classes';

describe('SectionHeaderComponent', () => {
  let fixture: ComponentFixture<SectionHeaderComponent>;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SectionHeaderComponent] }).compileComponents();

    fixture = TestBed.createComponent(SectionHeaderComponent);
    fixture.componentRef.setInput('heading', 'What I work on');
    fixture.componentRef.setInput('headingId', 'work-heading');
    fixture.componentRef.setInput('subtitle', 'The problems I spend my days on');
    fixture.detectChanges();
  });

  // A custom element is inline by default, and a parent's `space-y-*` margin does
  // nothing on an inline box: the divider ran straight into the cards below (0px).
  it('renders as a block, so the section spacing below it applies', () => {
    expect((fixture.nativeElement as HTMLElement).classList.contains('block')).toBe(true);
  });

  it('renders an h2 with the given id, for the section to be labelled by', () => {
    const h2 = el().querySelector('h2');

    expect(h2?.textContent?.trim()).toBe('What I work on');
    expect(h2?.id).toBe('work-heading');
  });

  // Header nav links jump here; the margin keeps the heading clear of the sticky header.
  it('keeps the heading clear of the sticky header when scrolled to', () => {
    expect(el().querySelector('h2')?.classList.contains('scroll-mt-24')).toBe(true);
  });

  it('renders the subtitle as muted text', () => {
    const subtitle = el().querySelector('p');

    expect(subtitle?.textContent?.trim()).toBe('The problems I spend my days on');
    expect(subtitle?.classList.contains('surface-muted')).toBe(true);
  });

  it('draws its divider in the outline token colour', () => {
    const header = el().firstElementChild;

    expect(header?.classList.contains('border-b')).toBe(true);
    expect(header?.classList.contains('surface-rule')).toBe(true);
  });

  it('colours itself from theme tokens, not the Tailwind palette', () => {
    expect(paletteClassesIn(el())).toEqual([]);
  });
});
