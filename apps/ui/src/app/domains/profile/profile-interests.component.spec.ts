import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileInterestsComponent } from './profile-interests.component';
import { Interest } from './profile.content';
import { paletteClassesIn } from '../../shared/testing/palette-classes';

const INTERESTS: Interest[] = [
  { name: 'Swimming', description: 'Endurance, not speed.', icon: 'pool' },
  { name: 'Chess', description: 'A slower kind of puzzle.', icon: 'extension' },
];

describe('ProfileInterestsComponent', () => {
  let fixture: ComponentFixture<ProfileInterestsComponent>;

  const el = () => fixture.nativeElement as HTMLElement;
  const panels = () => [...el().querySelectorAll<HTMLElement>('.interest-panel')];
  const toneOf = (panel: HTMLElement) => [...panel.classList].find(c => c.startsWith('tone-'));

  const render = (interests: Interest[]) => {
    fixture.componentRef.setInput('interests', interests);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileInterestsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileInterestsComponent);
    render(INTERESTS);
  });

  // The header on the page background above a coloured band read as a stray caption.
  it('is one band: the section carries the fill and the header sits inside it', () => {
    const band = el().querySelector('section.interest-section');

    expect(band).not.toBeNull();
    expect(band?.querySelector('app-section-header')).not.toBeNull();
  });

  it('is a section labelled by its headline', () => {
    const labelId = el().querySelector('section')?.getAttribute('aria-labelledby');

    expect(el().querySelector(`#${labelId}`)?.textContent?.trim()).toBe(
      'How I stay physical, sharp, and curious away from the keyboard',
    );
  });

  it('renders one panel per interest with its name and description', () => {
    expect(panels()).toHaveLength(2);
    expect(panels()[0].querySelector('h3')?.textContent?.trim()).toBe('Swimming');
    expect(panels()[0].textContent).toContain('Endurance, not speed.');
  });

  it('keeps the icons decorative', () => {
    for (const icon of el().querySelectorAll('mat-icon')) {
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    }
  });

  // Reference layout: one edge-to-edge row of filled panels, each carrying a
  // decorative two-digit counter in its top corner.
  it('lays the panels out as one full-bleed row', () => {
    expect(el().querySelector('.interest-panels')).not.toBeNull();
  });

  it('numbers each panel decoratively', () => {
    const counters = panels().map(p => p.querySelector('.interest-index'));

    expect(counters.map(c => c?.textContent?.trim())).toEqual(['01.', '02.']);
    for (const counter of counters) {
      expect(counter?.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('alternates panel tones so neighbours never share a fill', () => {
    expect(toneOf(panels()[0])).toBeDefined();
    expect(toneOf(panels()[0])).not.toBe(toneOf(panels()[1]));
  });

  // The fill *is* the boundary between panels — square edges, no border, no
  // shadow, and no gap, so the row reads as one band across the page.
  it('carries no card chrome — the fill is the only boundary', () => {
    for (const panel of panels()) {
      expect(panel.classList.contains('surface-card')).toBe(false);
      expect([...panel.classList]).not.toEqual(
        expect.arrayContaining([expect.stringMatching(/^(rounded|shadow|border)-/)]),
      );
    }
  });

  it('shows an empty state when there are no interests', () => {
    render([]);

    expect(panels()).toHaveLength(0);
    expect(el().textContent).toContain('Nothing to show yet.');
  });

  it('colours itself from theme tokens, not the Tailwind palette', () => {
    expect(paletteClassesIn(el())).toEqual([]);
  });
});
