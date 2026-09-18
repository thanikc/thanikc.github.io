import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProfileToolboxComponent } from './profile-toolbox.component';
import { ToolGroup } from './profile.content';
import { paletteClassesIn } from '../../shared/testing/palette-classes';

const GROUPS: ToolGroup[] = [
  { name: 'Frontend', tools: ['Angular', 'TypeScript'] },
  { name: 'Backend', tools: ['Spring Boot'] },
];

describe('ProfileToolboxComponent', () => {
  let fixture: ComponentFixture<ProfileToolboxComponent>;

  const el = () => fixture.nativeElement as HTMLElement;
  const terms = () => [...el().querySelectorAll('dt')].map(dt => dt.textContent?.trim());
  const details = () => [...el().querySelectorAll('dd')].map(dd => dd.textContent?.trim());

  const render = (groups: ToolGroup[]) => {
    fixture.componentRef.setInput('groups', groups);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileToolboxComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileToolboxComponent);
    render(GROUPS);
  });

  it('is a section labelled by its headline', () => {
    const labelId = el().querySelector('section')?.getAttribute('aria-labelledby');

    expect(el().querySelector(`#${labelId}`)?.textContent?.trim()).toBe(
      'The stack behind the work above',
    );
  });

  // Compact on purpose: one scannable line per group, not a wall of chip cards.
  it('lists each group as a term with its tools on one line', () => {
    expect(terms()).toEqual(['Frontend', 'Backend']);
    expect(details()).toEqual(['Angular · TypeScript', 'Spring Boot']);
  });

  // Redesign: flat on the page, no boxed card at all.
  it('carries no card chrome — flat on the page, not boxed', () => {
    const dl = el().querySelector('dl')!;

    expect(dl.classList.contains('surface-card')).toBe(false);
    expect([...dl.classList]).not.toEqual(
      expect.arrayContaining([expect.stringMatching(/^(rounded|shadow)-/)]),
    );
  });

  // Reference layout: header column beside the list, not stacked above it.
  it('puts the section header and the list side by side in one band', () => {
    const band = el().querySelector('.toolbox-band')!;

    expect(band.querySelector('app-section-header')).not.toBeNull();
    expect(band.querySelector('dl')).not.toBeNull();
  });

  // Each group is one ruled row — the hairline is the only boundary.
  it('rules each group off with a hairline', () => {
    const rows = [...el().querySelectorAll('dl > div')];

    expect(rows.length).toBe(GROUPS.length);
    expect(rows.every(row => row.classList.contains('surface-rule'))).toBe(true);
  });

  it('shows an empty state when there are no groups', () => {
    render([]);

    expect(el().querySelector('dl')).toBeNull();
    expect(el().textContent).toContain('Nothing to show yet.');
  });

  it('colours itself from theme tokens, not the Tailwind palette', () => {
    expect(paletteClassesIn(el())).toEqual([]);
  });
});
