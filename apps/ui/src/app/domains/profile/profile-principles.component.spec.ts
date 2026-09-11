import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { ProfilePrinciplesComponent } from './profile-principles.component';
import { Principle } from './profile.content';
import { AskLingLinkComponent } from '../chat/ask-ling-link.component';
import { ChatService } from '../chat/chat.service';
import { paletteClassesIn } from '../../shared/testing/palette-classes';

const PRINCIPLES: Principle[] = [
  {
    title: 'Find out why first',
    detail: 'Trace the bug to its root.',
    evidence: { kind: 'ask', label: 'Ask about that bug', question: 'What was the bug?' },
  },
  {
    title: 'Tests first',
    detail: 'Red, green, refactor.',
    evidence: {
      kind: 'link',
      label: 'Read the rules',
      url: 'https://github.com/example/AGENTS.md',
    },
  },
];

describe('ProfilePrinciplesComponent', () => {
  let fixture: ComponentFixture<ProfilePrinciplesComponent>;

  const el = () => fixture.nativeElement as HTMLElement;
  const items = () => [...el().querySelectorAll<HTMLLIElement>('ol > li')];

  const render = (principles: Principle[]) => {
    fixture.componentRef.setInput('principles', principles);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfilePrinciplesComponent],
      providers: [{ provide: ChatService, useValue: { open: vi.fn() } }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfilePrinciplesComponent);
    render(PRINCIPLES);
  });

  it('is a section labelled "How I work"', () => {
    const labelId = el().querySelector('section')?.getAttribute('aria-labelledby');

    expect(el().querySelector(`#${labelId}`)?.textContent?.trim()).toBe('How I work');
  });

  it('lists each principle in order with its title and detail', () => {
    expect(items()).toHaveLength(2);
    expect(items()[0].querySelector('h3')?.textContent?.trim()).toBe('Find out why first');
    expect(items()[0].textContent).toContain('Trace the bug to its root.');
    expect(items()[0].classList.contains('surface-card')).toBe(true);
  });

  // Evidence over adjectives: every principle points at something checkable.
  it('backs a principle with an Ask AI Ling hook', () => {
    const hook = fixture.debugElement.query(By.directive(AskLingLinkComponent))
      .componentInstance as AskLingLinkComponent;

    expect(hook.question()).toBe('What was the bug?');
    expect(hook.label()).toBe('Ask about that bug');
  });

  it('backs a principle with a link that opens safely in a new tab', () => {
    const link = items()[1].querySelector('a')!;

    expect(link.getAttribute('href')).toBe('https://github.com/example/AGENTS.md');
    expect(link.textContent).toContain('Read the rules');
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    expect(link.querySelector('.sr-only')?.textContent).toContain('opens in a new tab');
    expect(link.getAttribute('data-cta-tracking')).toBe('Principle: Read the rules');
    expect(link.classList.contains('min-h-11')).toBe(true);
  });

  it('shows an empty state when there are no principles', () => {
    render([]);

    expect(items()).toHaveLength(0);
    expect(el().textContent).toContain('Nothing to show yet.');
  });

  it('colours itself from theme tokens, not the Tailwind palette', () => {
    expect(paletteClassesIn(el())).toEqual([]);
  });
});
