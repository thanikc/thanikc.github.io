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

    expect(h2?.querySelector('.section-title')?.textContent?.trim()).toBe(
      'The problems I spend my days on',
    );
    expect(h2?.id).toBe('work-heading');
  });

  // Heading navigation should list sections by name ("What I work on"), not just
  // by their subtitles; the small label is part of the heading, not a <p> above it.
  it('puts the section name inside the heading, before its subtitle', () => {
    const h2 = el().querySelector('h2')!;

    expect(h2.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'What I work on: The problems I spend my days on',
    );
    expect(el().querySelector('p')).toBeNull();
  });

  // Header nav links jump here; the margin keeps the heading clear of the sticky header.
  it('keeps the heading clear of the sticky header when scrolled to', () => {
    expect(el().querySelector('h2')?.classList.contains('scroll-mt-24')).toBe(true);
  });

  // Eyebrow: a small tracked label
  // sits above the big display headline, in the page-muted pairing since this
  // component sits directly on the page background, not a raised card.
  it('renders the eyebrow as a small tracked label above the heading', () => {
    const eyebrow = el().querySelector('h2 .section-eyebrow');

    expect(eyebrow?.textContent?.trim()).toBe('What I work on');
    expect(eyebrow?.classList.contains('page-muted')).toBe(true);
    expect(eyebrow?.classList.contains('uppercase')).toBe(true);
    expect(eyebrow?.classList.contains('tracking-widest')).toBe(true);
  });

  // The eyebrow is set in the mono face across every section (the reference's
  // own section opener, and the same face the interest panels count in).
  it('sets the eyebrow in the mono face', () => {
    expect(el().querySelector('.section-eyebrow')?.classList.contains('font-mono')).toBe(true);
  });

  it('renders the heading in the display face, at headline size', () => {
    const title = el().querySelector('h2 .section-title');

    expect(title?.classList.contains('font-display')).toBe(true);
    expect(title?.classList.contains('text-3xl')).toBe(true);
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
