import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { ProfileThemesComponent } from './profile-themes.component';
import { WorkTheme } from './profile.content';
import { AskLingLinkComponent } from '../chat/ask-ling-link.component';
import { ChatService } from '../chat/chat.service';
import { paletteClassesIn } from '../../shared/testing/palette-classes';

const THEMES: WorkTheme[] = [
  {
    title: 'Large front ends',
    summary: 'Portals many teams build on.',
    chips: ['Angular', 'Web Components'],
    hookLabel: 'Ask what “large” means',
    question: 'What is the largest front end Thanik has worked on?',
  },
  {
    title: 'AI in a team',
    summary: 'Making AI output meet the team standard.',
    chips: ['TDD'],
    hookLabel: 'Ask how he uses AI',
    question: 'How does Thanik use AI in a team?',
  },
];

describe('ProfileThemesComponent', () => {
  let fixture: ComponentFixture<ProfileThemesComponent>;

  const el = () => fixture.nativeElement as HTMLElement;
  const cards = () => [...el().querySelectorAll<HTMLElement>('.theme-card')];

  const render = (themes: WorkTheme[]) => {
    fixture.componentRef.setInput('themes', themes);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileThemesComponent],
      providers: [{ provide: ChatService, useValue: { open: vi.fn() } }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileThemesComponent);
    render(THEMES);
  });

  it('is a section labelled "What I work on"', () => {
    const section = el().querySelector('section');
    const labelId = section?.getAttribute('aria-labelledby');

    expect(labelId).toBeTruthy();
    expect(el().querySelector(`#${labelId}`)?.textContent?.trim()).toBe('What I work on');
  });

  it('renders one static card per theme with its title and summary', () => {
    expect(cards()).toHaveLength(2);
    expect(cards()[0].tagName).toBe('ARTICLE');
    expect(cards()[0].querySelector('h3')?.textContent?.trim()).toBe('Large front ends');
    expect(cards()[0].textContent).toContain('Portals many teams build on.');
    expect(cards()[0].classList.contains('surface-card')).toBe(true);
  });

  // The stack appears once, in context, instead of as a separate list up front.
  it('lists each theme’s technologies as chips', () => {
    const chips = [...cards()[0].querySelectorAll('li.surface-chip')].map(c =>
      c.textContent?.trim(),
    );

    expect(chips).toEqual(['Angular', 'Web Components']);
  });

  // Curiosity hook: the card states the narrative, AI Ling supplies the depth.
  it('ends each card with an Ask AI Ling hook carrying that theme’s question', () => {
    const hooks = fixture.debugElement
      .queryAll(By.directive(AskLingLinkComponent))
      .map(hook => hook.componentInstance as AskLingLinkComponent);

    expect(hooks.map(hook => hook.question())).toEqual(THEMES.map(theme => theme.question));
    expect(hooks.map(hook => hook.label())).toEqual(THEMES.map(theme => theme.hookLabel));
  });

  it('shows an empty state when there are no themes', () => {
    render([]);

    expect(cards()).toHaveLength(0);
    expect(el().textContent).toContain('Nothing to show yet.');
  });

  it('colours itself from theme tokens, not the Tailwind palette', () => {
    expect(paletteClassesIn(el())).toEqual([]);
  });
});
