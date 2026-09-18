import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SectionHeaderComponent } from './section-header.component';
import { paletteClassesIn } from '../../shared/testing/palette-classes';

describe('SectionHeaderComponent', () => {
  let fixture: ComponentFixture<SectionHeaderComponent>;
  const el = () => fixture.nativeElement as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SectionHeaderComponent] }).compileComponents();

    fixture = TestBed.createComponent(SectionHeaderComponent);
    fixture.componentRef.setInput('eyebrow', 'What I work on');
    fixture.componentRef.setInput('headingId', 'work-heading');
    fixture.componentRef.setInput('heading', 'The problems I spend my days on');
    fixture.detectChanges();
  });

  // A custom element is inline by default, and a parent's `space-y-*` margin does
  // nothing on an inline box: the block below ran straight into the cards (0px gap).
  it('renders as a block, so the section spacing below it applies', () => {
    expect((fixture.nativeElement as HTMLElement).classList.contains('block')).toBe(true);
  });

  it('renders an h2 with the given id, for the section to be labelled by', () => {
    const h2 = el().querySelector('h2');

    expect(h2?.textContent?.trim()).toBe('The problems I spend my days on');
    expect(h2?.id).toBe('work-heading');
  });

  // Header nav links jump here; the margin keeps the heading clear of the sticky header.
  it('keeps the heading clear of the sticky header when scrolled to', () => {
    expect(el().querySelector('h2')?.classList.contains('scroll-mt-24')).toBe(true);
  });

  // Eyebrow: a small tracked label
  // sits above the big display headline, in the page-muted pairing since this
  // component sits directly on the page background, not a raised card.
  it('renders the eyebrow as a small tracked label above the heading', () => {
    const eyebrow = el().querySelector('p');

    expect(eyebrow?.textContent?.trim()).toBe('What I work on');
    expect(eyebrow?.classList.contains('page-muted')).toBe(true);
    expect(eyebrow?.classList.contains('uppercase')).toBe(true);
    expect(eyebrow?.classList.contains('tracking-widest')).toBe(true);
  });

  // The eyebrow is set in the mono face across every section (the reference's
  // own section opener, and the same face the interest panels count in).
  it('sets the eyebrow in the mono face', () => {
    expect(el().querySelector('p')?.classList.contains('font-mono')).toBe(true);
  });

  it('renders the heading in the display face, at headline size', () => {
    const h2 = el().querySelector('h2');

    expect(h2?.classList.contains('font-display')).toBe(true);
    expect(h2?.classList.contains('text-3xl')).toBe(true);
  });

  // .section-heading opts the h2 out of the global decorative rule (h2::after,
  // material.scss) — no section opener draws one.
  it('marks the heading as a section opener, so it carries no decorative rule', () => {
    expect(el().querySelector('h2')?.classList.contains('section-heading')).toBe(true);
  });

  // No rule under a section header — a leftover divider from before the redesign.
  it('draws no divider under the heading', () => {
    expect(el().querySelector('.border-b')).toBeNull();
  });

  it('colours itself from theme tokens, not the Tailwind palette', () => {
    expect(paletteClassesIn(el())).toEqual([]);
  });
});
