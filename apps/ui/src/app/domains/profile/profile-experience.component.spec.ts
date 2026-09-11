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
  const cards = () => [...el().querySelectorAll<HTMLElement>('.experience-card')];

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

  it('is a section labelled "Experience"', () => {
    const section = el().querySelector('section');
    const labelId = section?.getAttribute('aria-labelledby');

    expect(labelId).toBeTruthy();
    expect(el().querySelector(`#${labelId}`)?.textContent?.trim()).toBe('Experience');
  });

  it('renders one card per stat with its headline and detail', () => {
    expect(cards()).toHaveLength(2);
    expect(cards()[0].querySelector('h3')?.textContent?.trim()).toBe('25+ years');
    expect(cards()[0].textContent).toContain('In software since 1999.');
    expect(cards()[0].classList.contains('surface-card')).toBe(true);
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
