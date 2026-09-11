import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { AskLingLinkComponent } from './ask-ling-link.component';
import { ChatService } from './chat.service';
import { paletteClassesIn } from '../../shared/testing/palette-classes';

describe('AskLingLinkComponent', () => {
  let fixture: ComponentFixture<AskLingLinkComponent>;

  const mockChatService = { open: vi.fn((_question?: string) => undefined) };
  const QUESTION = 'What has Thanik built from scratch?';

  const el = () => fixture.nativeElement as HTMLElement;
  const button = () => el().querySelector<HTMLButtonElement>('button')!;

  beforeEach(async () => {
    mockChatService.open.mockClear();

    await TestBed.configureTestingModule({
      imports: [AskLingLinkComponent],
      providers: [{ provide: ChatService, useValue: mockChatService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AskLingLinkComponent);
    fixture.componentRef.setInput('question', QUESTION);
    fixture.detectChanges();
  });

  it('renders a button labelled "Ask AI Ling" by default', () => {
    expect(button().type).toBe('button');
    expect(button().querySelector('.ask-ling-label')?.textContent?.trim()).toBe('Ask AI Ling');
  });

  it('renders a custom label', () => {
    fixture.componentRef.setInput('label', 'Ask what that involved');
    fixture.detectChanges();

    expect(button().querySelector('.ask-ling-label')?.textContent?.trim()).toBe(
      'Ask what that involved',
    );
  });

  it('opens AI Ling with its question when clicked', () => {
    button().click();

    expect(mockChatService.open).toHaveBeenCalledWith(QUESTION);
  });

  // Out of context the visible label ("Ask what that involved") says little, so
  // screen readers also hear which question gets asked, and that a dialog opens.
  it('tells assistive tech which question it asks', () => {
    const hint = button().querySelector('.sr-only');

    expect(hint?.textContent).toContain(QUESTION);
    expect(hint?.textContent).toContain('AI Ling');
    expect(button().getAttribute('aria-haspopup')).toBe('dialog');
  });

  // Same portrait as the floating launcher: the link visibly belongs to the chat.
  it('shows the AI Ling portrait as decoration', () => {
    const img = button().querySelector('img')!;

    expect(img.getAttribute('src')).toContain('chat_avatar_352x432.png');
    expect(img.getAttribute('alt')).toBe('');
    expect(img.getAttribute('aria-hidden')).toBe('true');
    expect(img.getAttribute('width')).toBeTruthy();
    expect(img.getAttribute('height')).toBeTruthy();
  });

  // Without a question it just opens the chat, where the starters take over.
  it('opens AI Ling without a question when given none', () => {
    fixture.componentRef.setInput('question', undefined);
    fixture.detectChanges();

    button().click();

    expect(mockChatService.open).toHaveBeenCalledWith(undefined);
    expect(button().querySelector('.sr-only')?.textContent?.trim()).toBe(
      ': opens the AI Ling chat',
    );
    expect(button().getAttribute('data-cta-tracking')).toBe('Ask AI Ling');
  });

  it('reports the question to CTA analytics', () => {
    expect(button().getAttribute('data-cta-tracking')).toBe(`Ask AI Ling: ${QUESTION}`);
  });

  it('is a text button by default and filled on request', () => {
    expect(button().classList.contains('mat-mdc-button')).toBe(true);

    fixture.componentRef.setInput('appearance', 'filled');
    fixture.detectChanges();

    expect(button().classList.contains('mat-mdc-unelevated-button')).toBe(true);
  });

  it('meets the 44px touch target', () => {
    expect(button().classList.contains('min-h-11')).toBe(true);
  });

  it('colours itself from theme tokens, not the Tailwind palette', () => {
    expect(paletteClassesIn(el())).toEqual([]);
  });
});
