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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('structure', () => {
    it('is a dialog labelled by its heading', () => {
      const dialog = el().querySelector('[role="dialog"]');
      const labelId = dialog?.getAttribute('aria-labelledby');

      expect(labelId).toBeTruthy();
      expect(el().querySelector(`#${labelId}`)?.textContent?.trim()).toBe('AI Ling');
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

    // Starters beat the blank-chat problem and should lead into the depth the static
    // page leaves out — not repeat what it already says (role, stack) or trivia.
    it('offers four starter questions that go beyond the static page', () => {
      const starters = [...el().querySelectorAll('.chat-empty button')].map(b =>
        b.textContent!.trim(),
      );

      expect(starters).toEqual([
        "What's the most complex system Thanik has worked on?",
        'What has Thanik built from scratch?',
        'How does Thanik use AI in a team?',
        'How does AI Ling work?',
      ]);
    });

    // A full question doesn't fit one line of a 360px sheet; a fixed-height
    // Material button would clip it, so starters get a wrapping style.
    it('lets long starter questions wrap', () => {
      const starters = [...el().querySelectorAll('.chat-empty button')];

      for (const starter of starters) {
        expect(starter.classList.contains('chat-suggestion')).toBe(true);
      }
    });

    it('promises more than the page in its subtitle', () => {
      expect(el().querySelector('header p')?.textContent).toContain(
        "including the parts that aren't on this page",
      );
    });

    it('emits a suggested question as a send', () => {
      const suggestion = el().querySelector<HTMLButtonElement>('.chat-empty button')!;
      suggestion.click();

      expect(sendSpy).toHaveBeenCalledWith(suggestion.textContent!.trim());
    });

    // "Looked in", not "based on": retrieval always returns its closest chunks, so
    // the label claims only where the assistant searched, not what it used.
    it('lists where an answer looked, under the answer', () => {
      setInputs({
        turns: [
          { role: 'user', content: 'What has Thanik built?' },
          { role: 'assistant', content: 'Two banking products.', sources: ['Projects', 'Summary'] },
        ],
      });

      const sources = transcriptItems()[1].querySelector('.chat-sources');
      expect(sources?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
        'Looked in: Projects · Summary',
      );
    });

    it('shows no source line when an answer has no sources', () => {
      setInputs({ turns: TURNS });

      expect(el().querySelector('.chat-sources')).toBeNull();
    });

    it('renders turns in order with role-distinct markup', () => {
      setInputs({ turns: TURNS });
      const items = transcriptItems();

      expect(el().querySelector('.chat-empty')).toBeNull();
      expect(items.map(li => li.dataset['role'])).toEqual(['user', 'assistant', 'user']);
      expect(items.map(li => li.querySelector('.chat-message')?.textContent?.trim())).toEqual(
        TURNS.map(t => t.content),
      );
    });

    // Bubble alignment and colour alone do not tell a screen reader who spoke.
    it('labels each turn with its speaker for assistive tech', () => {
      setInputs({ turns: TURNS });
      const labels = transcriptItems().map(li => li.querySelector('.sr-only')?.textContent?.trim());

      expect(labels[0]).toMatch(/you/i);
      expect(labels[1]).toBe('AI Ling said:');
    });

    it('shows a typing indicator only while pending', () => {
      setInputs({ turns: TURNS });
      expect(el().querySelector('.chat-typing')).toBeNull();

      setInputs({ pending: true });
      expect(el().querySelector('.chat-typing')).not.toBeNull();
      expect(el().querySelector('.chat-typing .sr-only')?.textContent).toContain('AI Ling');
    });

    // One avatar in the header says who is speaking. Repeating it per turn spends
    // ~40px of the panel's width restating what the dialog title already carries.
    it('shows the assistant avatar once in the header, never per turn', () => {
      setInputs({ turns: TURNS });

      const avatar = el().querySelector<HTMLImageElement>('header img.chat-avatar');
      expect(avatar).not.toBeNull();
      expect(avatar!.getAttribute('src')).toContain('chat_avatar');
      expect(avatar!.getAttribute('alt')).toBe('');
      expect(avatar!.getAttribute('width')).toBeTruthy();
      expect(avatar!.getAttribute('height')).toBeTruthy();

      expect(el().querySelectorAll('ol img.chat-avatar')).toHaveLength(0);
      expect(el().querySelector('.chat-typing img.chat-avatar')).toBeNull();
    });

    // A bubble caps the measure near 40 characters, well under the 65-75 the type
    // scale targets, and the assistant is the side that answers in Markdown prose.
    it('bubbles user turns and renders assistant turns full width', () => {
      setInputs({ turns: TURNS });
      const [userItem, assistantItem] = transcriptItems();

      expect(userItem.querySelector('.chat-message.chat-bubble')).not.toBeNull();
      expect(assistantItem.querySelector('.chat-message')).not.toBeNull();
      expect(assistantItem.querySelector('.chat-bubble')).toBeNull();
    });

    it('animates the typing indicator with three dots', () => {
      setInputs({ turns: TURNS, pending: true });

      expect(el().querySelectorAll('.chat-typing .chat-dot')).toHaveLength(3);
    });
  });

  describe('disclosure', () => {
    // The answers are generated, and the panel is the only place a visitor reads
    // them — the disclosure belongs here, not only in the privacy policy. It closes
    // the transcript rather than the composer, and stays out of the live region so
    // it is not re-announced with every turn.
    it('closes the transcript by naming the answers as AI-generated', () => {
      setInputs({ turns: TURNS });
      const note = el().querySelector('.chat-disclaimer')!;

      expect(note).not.toBeNull();
      expect(note.textContent).toMatch(/\bAI\b/);
      expect(el().querySelector('.chat-transcript')!.lastElementChild).toBe(note);
      expect(el().querySelector('ol')!.contains(note)).toBe(false);
      expect(el().querySelector('.chat-composer')!.textContent).not.toMatch(/\bAI\b/);
    });
  });

  describe('markdown rendering', () => {
    it('renders assistant Markdown as formatted HTML', () => {
      setInputs({
        turns: [
          { role: 'assistant', content: 'Thanik knows **Angular** and:\n\n- RxJS\n- Signals' },
        ],
      });
      const bubble = transcriptItems()[0].querySelector('.chat-message')!;

      expect(bubble.querySelector('strong')?.textContent).toBe('Angular');
      expect(bubble.querySelectorAll('li')).toHaveLength(2);
    });

    it('shows user Markdown verbatim rather than as HTML', () => {
      setInputs({ turns: [{ role: 'user', content: 'what about **bold**?' }] });
      const bubble = transcriptItems()[0].querySelector('.chat-message')!;

      expect(bubble.querySelector('strong')).toBeNull();
      expect(bubble.textContent).toContain('**bold**');
    });

    it('strips unsafe markup from assistant content', () => {
      // Angular's sanitizer warns to the console whenever it strips content;
      // that's exactly what this test exercises, so silence the expected noise.
      vi.spyOn(console, 'warn').mockImplementation(() => {});

      setInputs({
        turns: [
          {
            role: 'assistant',
            content: 'hi <script>alert(1)</script> <img src="x" onerror="alert(1)">',
          },
        ],
      });
      const bubble = transcriptItems()[0].querySelector('.chat-message')!;

      expect(bubble.querySelector('script')).toBeNull();
      expect(bubble.querySelector('img')?.hasAttribute('onerror')).not.toBe(true);
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

    it('pairs the error with an icon rather than carrying it by colour alone', () => {
      setInputs({ turns: TURNS, error: 'Something went wrong' });

      expect(el().querySelector('[role="alert"] mat-icon')).not.toBeNull();
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

    // Send silently no-ops on an empty draft or a pending reply; a live-looking
    // control that does nothing is the defect, so say so in the button's state.
    it('disables send until there is a message to send', () => {
      expect(sendButton().disabled).toBe(true);

      type('Hello');
      expect(sendButton().disabled).toBe(false);

      type('   ');
      expect(sendButton().disabled).toBe(true);
    });

    it('disables send while a reply is pending', () => {
      type('Hello');
      setInputs({ pending: true });

      expect(sendButton().disabled).toBe(true);
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

  describe('scroll anchoring', () => {
    const transcript = () => el().querySelector<HTMLElement>('.chat-transcript')!;

    // jsdom does no layout, so the scroll geometry has to be stubbed onto the node.
    const stubScroll = (scrollTop: number) => {
      const node = transcript();
      let top = scrollTop;
      Object.defineProperty(node, 'scrollHeight', { configurable: true, value: 1000 });
      Object.defineProperty(node, 'clientHeight', { configurable: true, value: 400 });
      Object.defineProperty(node, 'scrollTop', {
        configurable: true,
        get: () => top,
        set: (value: number) => (top = value),
      });
      node.dispatchEvent(new Event('scroll'));
      return node;
    };

    it('follows the conversation while the reader is at the bottom', async () => {
      setInputs({ turns: TURNS });
      const node = stubScroll(600); // 1000 - 400: pinned to the bottom

      setInputs({ turns: [...TURNS, { role: 'assistant', content: 'Since 2019.' }] });
      await fixture.whenStable();

      expect(node.scrollTop).toBe(1000);
    });

    // Yanking the reader back down mid-scroll is the bug: they are reading something.
    it('leaves the scroll alone once the reader has scrolled up', async () => {
      setInputs({ turns: TURNS });
      const node = stubScroll(100);

      setInputs({ turns: [...TURNS, { role: 'assistant', content: 'Since 2019.' }] });
      await fixture.whenStable();

      expect(node.scrollTop).toBe(100);
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
