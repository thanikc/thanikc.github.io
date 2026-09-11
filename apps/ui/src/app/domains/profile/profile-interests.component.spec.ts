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
  const cards = () => [...el().querySelectorAll<HTMLElement>('.interest-card')];

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

  it('is a section labelled "Beyond the Code"', () => {
    const labelId = el().querySelector('section')?.getAttribute('aria-labelledby');

    expect(el().querySelector(`#${labelId}`)?.textContent?.trim()).toBe('Beyond the Code');
  });

  it('renders one card per interest with its name and description', () => {
    expect(cards()).toHaveLength(2);
    expect(cards()[0].querySelector('h3')?.textContent?.trim()).toBe('Swimming');
    expect(cards()[0].textContent).toContain('Endurance, not speed.');
  });

  it('keeps the icons decorative', () => {
    for (const icon of el().querySelectorAll('mat-icon')) {
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    }
  });

  // Personality, not proof: lighter than the work sections above it.
  it('sits visually lighter than the work sections — compact padding, no shadow', () => {
    for (const card of cards()) {
      expect(card.classList.contains('surface-card')).toBe(true);
      expect(card.classList.contains('p-4')).toBe(true);
      expect(card.classList.contains('shadow-sm')).toBe(false);
    }
  });

  it('shows an empty state when there are no interests', () => {
    render([]);

    expect(cards()).toHaveLength(0);
    expect(el().textContent).toContain('Nothing to show yet.');
  });

  it('colours itself from theme tokens, not the Tailwind palette', () => {
    expect(paletteClassesIn(el())).toEqual([]);
  });
});
