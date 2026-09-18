import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { ProfileExperienceComponent } from './profile-experience.component';
import { ExperienceStat } from './profile.content';
import { AskLingLinkComponent } from '../chat/ask-ling-link.component';
import { ChatService } from '../chat/chat.service';
import { paletteClassesIn } from '../../shared/testing/palette-classes';

const STATS: ExperienceStat[] = [
  {
    headline: '25+ years',
    detail: 'In software since 1999.',
    hookLabel: 'Ask about the roles',
    question: 'What roles has Thanik had?',
  },
  {
    headline: 'Reviews and mentors',
    detail: 'Runs code reviews and mentors juniors.',
    hookLabel: 'Ask how he leads',
    question: 'How does Thanik lead?',
  },
];

describe('ProfileExperienceComponent', () => {
  let fixture: ComponentFixture<ProfileExperienceComponent>;

  const el = () => fixture.nativeElement as HTMLElement;
  const cards = () => [...el().querySelectorAll<HTMLElement>('.experience-entry')];

  const render = (stats: ExperienceStat[]) => {
    fixture.componentRef.setInput('stats', stats);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileExperienceComponent],
      providers: [{ provide: ChatService, useValue: { open: vi.fn() } }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileExperienceComponent);
    render(STATS);
  });

  // The header on the page background above a coloured band read as a stray caption.
  it('is one band: the section carries the fill and the header sits inside it', () => {
    const band = el().querySelector('section.experience-section');

    expect(band).not.toBeNull();
    expect(band?.querySelector('app-section-header')).not.toBeNull();
  });

  it('is a section labelled by its headline', () => {
    const section = el().querySelector('section');
    const labelId = section?.getAttribute('aria-labelledby');

    expect(labelId).toBeTruthy();
    expect(el().querySelector(`#${labelId}`)?.textContent?.trim()).toBe(
      'Scale and responsibility, in specifics',
    );
  });

  it('renders one bio-style entry per stat with its headline and detail', () => {
    expect(cards()).toHaveLength(2);
    expect(cards()[0].querySelector('h3')?.textContent?.trim()).toBe('25+ years');
    expect(cards()[0].textContent).toContain('In software since 1999.');
  });

  // Eyebrow + large headline + prose column, not a bordered card grid.
  describe('bio-style layout', () => {
    it('numbers each entry 01., 02., …', () => {
      const numbers = cards().map(c => c.querySelector('.experience-number')?.textContent?.trim());

      expect(numbers).toEqual(['01.', '02.']);
    });

    it('sets the headline in the display font', () => {
      expect(cards()[0].querySelector('h3')?.classList.contains('font-display')).toBe(true);
    });

    it('caps the detail prose to a comfortable measure', () => {
      const detail = cards()[0].querySelector('p');

      expect(detail?.classList.contains('max-w-prose')).toBe(true);
    });

    it('is a light section, not a bordered card grid', () => {
      expect(el().querySelector('.experience-section')).not.toBeNull();
      expect(el().querySelector('.surface-card')).toBeNull();
    });
  });

  it('backs each stat with an Ask AI Ling hook carrying its question', () => {
    const hooks = fixture.debugElement
      .queryAll(By.directive(AskLingLinkComponent))
      .map(hook => hook.componentInstance as AskLingLinkComponent);

    expect(hooks.map(hook => hook.question())).toEqual(STATS.map(stat => stat.question));
    expect(hooks.map(hook => hook.label())).toEqual(STATS.map(stat => stat.hookLabel));
  });

  it('shows an empty state when there are no stats', () => {
    render([]);

    expect(cards()).toHaveLength(0);
    expect(el().textContent).toContain('Nothing to show yet.');
  });

  it('colours itself from theme tokens, not the Tailwind palette', () => {
    expect(paletteClassesIn(el())).toEqual([]);
  });
});
