import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { ProfileAskLingComponent } from './profile-ask-ling.component';
import { AskLingLinkComponent } from '../chat/ask-ling-link.component';
import { ChatService } from '../chat/chat.service';
import { paletteClassesIn } from '../../shared/testing/palette-classes';

const PROMPTS: readonly string[] = [
  "What's the most complex system Thanik has worked on?",
  'What has Thanik built from scratch?',
];

describe('ProfileAskLingComponent', () => {
  let fixture: ComponentFixture<ProfileAskLingComponent>;

  const el = () => fixture.nativeElement as HTMLElement;

  const render = (prompts: readonly string[]) => {
    fixture.componentRef.setInput('prompts', prompts);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileAskLingComponent],
      providers: [{ provide: ChatService, useValue: { open: vi.fn() } }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileAskLingComponent);
    render(PROMPTS);
  });

  it('is a section that frames AI Ling as a way to explore the page', () => {
    const section = el().querySelector('section');
    const labelId = section?.getAttribute('aria-labelledby');

    expect(labelId).toBeTruthy();
    expect(el().querySelector(`#${labelId}`)?.textContent).toBeTruthy();
    expect(el().textContent).toContain('Ask AI Ling');
  });

  it('renders one outlined hook per prompt, asking that exact question', () => {
    const hooks = fixture.debugElement
      .queryAll(By.directive(AskLingLinkComponent))
      .map(hook => hook.componentInstance as AskLingLinkComponent);

    expect(hooks).toHaveLength(2);
    expect(hooks.map(hook => hook.question())).toEqual(PROMPTS);
    expect(hooks.map(hook => hook.label())).toEqual(PROMPTS);
    for (const hook of hooks) {
      expect(hook.appearance()).toBe('outlined');
    }
  });

  it('shows an empty state when there are no prompts', () => {
    render([]);

    expect(el().querySelectorAll('app-ask-ling-link')).toHaveLength(0);
  });

  it('colours itself from theme tokens, not the Tailwind palette', () => {
    expect(paletteClassesIn(el())).toEqual([]);
  });
});
