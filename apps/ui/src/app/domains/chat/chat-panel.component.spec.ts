import { ComponentFixture, TestBed } from '@angular/core/testing';
import { type Mock, vi } from 'vitest';
import { ChatPanelComponent } from './chat-panel.component';
import { ChatTurn } from './chat.models';
import { paletteClassesIn } from '../../shared/testing/palette-classes';

const TURNS: ChatTurn[] = [
  { role: 'user', content: 'Where does Thanik work?' },
  { role: 'assistant', content: 'At a consultancy.' },
  { role: 'user', content: 'Since when?' },
];

describe('ChatPanelComponent', () => {
  let fixture: ComponentFixture<ChatPanelComponent>;
  let sendSpy: Mock<(message: string) => void>;
  let closeSpy: Mock<() => void>;
  let retrySpy: Mock<() => void>;

  const el = () => fixture.nativeElement as HTMLElement;
  const textarea = () => el().querySelector<HTMLTextAreaElement>('form textarea')!;
  const sendButton = () => el().querySelector<HTMLButtonElement>('form button[type="submit"]')!;
  const transcriptItems = () => [...el().querySelectorAll<HTMLLIElement>('ol > li')];

  const setInputs = (inputs: { turns?: ChatTurn[]; pending?: boolean; error?: string | null }) => {
    for (const [name, value] of Object.entries(inputs)) {
      fixture.componentRef.setInput(name, value);
    }
    fixture.detectChanges();
  };

  const type = (value: string) => {
    textarea().value = value;
    textarea().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const pressKey = (target: HTMLElement, key: string, init: KeyboardEventInit = {}) => {
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(event);
    fixture.detectChanges();
    return event;
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatPanelComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatPanelComponent);
    sendSpy = vi.fn();
    closeSpy = vi.fn();
    retrySpy = vi.fn();
    fixture.componentInstance.send.subscribe(sendSpy);
    fixture.componentInstance.close.subscribe(closeSpy);
    fixture.componentInstance.retry.subscribe(retrySpy);
    setInputs({ turns: [] });
  });

  describe('structure', () => {
    it('is a dialog labelled by its heading', () => {
      const dialog = el().querySelector('[role="dialog"]');
      const labelId = dialog?.getAttribute('aria-labelledby');

      expect(labelId).toBeTruthy();
      expect(el().querySelector(`#${labelId}`)?.textContent?.trim()).not.toBe('');
    });

    it('announces new transcript entries politely', () => {
      setInputs({ turns: TURNS });

      expect(el().querySelector('ol')?.getAttribute('aria-live')).toBe('polite');
    });

    it('colours the panel from theme tokens, not the Tailwind palette', () => {
      setInputs({ turns: TURNS, pending: true, error: 'Oops' });

      expect(paletteClassesIn(el())).toEqual([]);
    });

    it('uses Material buttons with a 44px minimum hit area', () => {
      setInputs({ turns: TURNS, error: 'Oops' });
      const buttons = [...el().querySelectorAll<HTMLButtonElement>('button')];

      expect(buttons.length).toBeGreaterThan(0);
      for (const button of buttons) {
        expect(button.classList.contains('mat-mdc-button-base')).toBe(true);
        expect(button.classList.contains('min-h-11')).toBe(true);
      }
    });
  });

  describe('transcript', () => {
    it('shows an empty state with suggested questions when there are no turns', () => {
      expect(transcriptItems()).toHaveLength(0);
      expect(el().querySelector('.chat-empty')).not.toBeNull();
      expect(el().querySelectorAll('.chat-empty button').length).toBeGreaterThan(0);
    });

    it('emits a suggested question as a send', () => {
      const suggestion = el().querySelector<HTMLButtonElement>('.chat-empty button')!;
      suggestion.click();

      expect(sendSpy).toHaveBeenCalledWith(suggestion.textContent!.trim());
    });

    it('renders turns in order with role-distinct markup', () => {
      setInputs({ turns: TURNS });
      const items = transcriptItems();

      expect(el().querySelector('.chat-empty')).toBeNull();
      expect(items.map(li => li.dataset['role'])).toEqual(['user', 'assistant', 'user']);
      expect(items.map(li => li.querySelector('.chat-bubble')?.textContent?.trim())).toEqual(
        TURNS.map(t => t.content),
      );
    });

    // Bubble alignment and colour alone do not tell a screen reader who spoke.
    it('labels each turn with its speaker for assistive tech', () => {
      setInputs({ turns: TURNS });
      const labels = transcriptItems().map(li => li.querySelector('.sr-only')?.textContent?.trim());

      expect(labels[0]).toMatch(/you/i);
      expect(labels[1]).toMatch(/assistant/i);
    });

    it('shows a typing indicator only while pending', () => {
      setInputs({ turns: TURNS });
      expect(el().querySelector('.chat-typing')).toBeNull();

      setInputs({ pending: true });
      expect(el().querySelector('.chat-typing')).not.toBeNull();
    });

    // The avatar identifies who is speaking at a glance, mirroring the launcher FAB.
    it('leads each assistant turn with a decorative round avatar, and no user turn', () => {
      setInputs({ turns: TURNS });
      const [userItem, assistantItem] = transcriptItems();

      const avatar = assistantItem.querySelector<HTMLImageElement>('img.chat-avatar');
      expect(avatar).not.toBeNull();
      expect(avatar!.getAttribute('src')).toContain('chat_avatar');
      expect(avatar!.getAttribute('alt')).toBe('');
      expect(avatar!.getAttribute('width')).toBeTruthy();
      expect(avatar!.getAttribute('height')).toBeTruthy();
      // Avatar precedes the bubble in the DOM so it reads as "leading" the answer.
      expect(assistantItem.querySelector('.chat-avatar ~ .chat-bubble')).not.toBeNull();

      expect(userItem.querySelector('img.chat-avatar')).toBeNull();
    });

    it('leads the typing indicator with the same avatar', () => {
      setInputs({ turns: TURNS, pending: true });
      const avatar = el().querySelector<HTMLImageElement>('.chat-typing img.chat-avatar');

      expect(avatar).not.toBeNull();
      expect(avatar!.getAttribute('src')).toContain('chat_avatar');
    });
  });

  describe('errors', () => {
    it('shows the error as an alert with a retry button', () => {
      setInputs({ turns: TURNS, error: 'Something went wrong' });
      const alert = el().querySelector('[role="alert"]');

      expect(alert?.textContent).toContain('Something went wrong');
      expect(alert?.querySelector('button')?.textContent).toMatch(/retry|try again/i);
    });

    it('emits retry when the retry button is clicked', () => {
      setInputs({ turns: TURNS, error: 'Something went wrong' });
      el().querySelector<HTMLButtonElement>('[role="alert"] button')!.click();

      expect(retrySpy).toHaveBeenCalledTimes(1);
    });

    it('shows no alert without an error', () => {
      setInputs({ turns: TURNS });

      expect(el().querySelector('[role="alert"]')).toBeNull();
    });
  });

  describe('composer', () => {
    it('labels the message field', () => {
      const id = textarea().id;

      expect(id).toBeTruthy();
      expect(el().querySelector(`label[for="${id}"]`)).not.toBeNull();
    });

    it('emits the trimmed message on submit and clears the input', () => {
      type('  Where does Thanik work?  ');
      sendButton().click();
      fixture.detectChanges();

      expect(sendSpy).toHaveBeenCalledWith('Where does Thanik work?');
      expect(textarea().value).toBe('');
    });

    it.each(['', '   '])('does not emit for %j', value => {
      type(value);
      sendButton().click();

      expect(sendSpy).not.toHaveBeenCalled();
    });

    it('does not emit while a reply is pending, and keeps the draft', () => {
      setInputs({ turns: TURNS, pending: true });
      type('Another question');
      el()
        .querySelector('form')!
        .dispatchEvent(new Event('submit', { cancelable: true }));
      fixture.detectChanges();

      expect(sendSpy).not.toHaveBeenCalled();
      expect(textarea().value).toBe('Another question');
    });

    it('submits on Enter', () => {
      type('Hello');
      const event = pressKey(textarea(), 'Enter');

      expect(sendSpy).toHaveBeenCalledWith('Hello');
      expect(event.defaultPrevented).toBe(true);
    });

    it('inserts a newline on Shift+Enter instead of submitting', () => {
      type('Hello');
      const event = pressKey(textarea(), 'Enter', { shiftKey: true });

      expect(sendSpy).not.toHaveBeenCalled();
      expect(event.defaultPrevented).toBe(false);
    });
  });

  describe('closing', () => {
    it('emits close on Escape from anywhere in the panel', () => {
      pressKey(textarea(), 'Escape');

      expect(closeSpy).toHaveBeenCalledTimes(1);
    });

    it('emits close from the labelled close button', () => {
      const close = el().querySelector<HTMLButtonElement>('button[aria-label="Close chat"]');
      close!.click();

      expect(closeSpy).toHaveBeenCalledTimes(1);
    });
  });
});
