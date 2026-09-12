import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { By } from '@angular/platform-browser';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { vi } from 'vitest';
import { ChatWidgetComponent } from './chat-widget.component';
import { ChatPanelComponent } from './chat-panel.component';
import { ChatService } from './chat.service';
import { ChatTurn } from './chat.models';
import { paletteClassesIn } from '../../shared/testing/palette-classes';

describe('ChatWidgetComponent', () => {
  let fixture: ComponentFixture<ChatWidgetComponent>;

  const turns = signal<ChatTurn[]>([]);
  const pending = signal(false);
  const error = signal<string | null>(null);
  const isOpen = signal(false);
  const mockChatService = {
    turns,
    pending,
    error,
    isOpen,
    hasConversation: signal(false),
    send: vi.fn(async (_message: string) => undefined),
    retry: vi.fn(async () => undefined),
    reset: vi.fn(),
    open: vi.fn((_question?: string) => isOpen.set(true)),
    close: vi.fn(() => isOpen.set(false)),
  };

  const el = () => fixture.nativeElement as HTMLElement;
  const fab = () => el().querySelector<HTMLButtonElement>('button.chat-fab')!;
  const panel = () => fixture.debugElement.query(By.directive(ChatPanelComponent));
  const panelInstance = () => panel().componentInstance as ChatPanelComponent;

  const openPanel = () => {
    fab().click();
    fixture.detectChanges();
  };

  // jsdom never lays elements out, so CdkTrapFocus's focusability check sees zero
  // geometry on the textarea it auto-captures and warns "not focusable" -- a
  // test-environment artifact, not a real accessibility bug. Let any other
  // warning through so this doesn't hide something real.
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    turns.set([]);
    pending.set(false);
    error.set(null);
    isOpen.set(false);
    mockChatService.send.mockClear();
    mockChatService.retry.mockClear();
    mockChatService.open.mockClear();
    mockChatService.close.mockClear();

    const originalWarn = console.warn.bind(console);
    warnSpy = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      if (typeof args[0] === 'string' && args[0].includes('cdkFocusInitial')) {
        return;
      }
      originalWarn(...args);
    });

    await TestBed.configureTestingModule({
      imports: [ChatWidgetComponent],
      providers: [{ provide: ChatService, useValue: mockChatService }],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatWidgetComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.nativeElement.remove();
    warnSpy.mockRestore();
  });

  describe('launcher', () => {
    it('renders an avatar FAB and no panel initially', () => {
      expect(fab().type).toBe('button');
      expect(fab().getAttribute('aria-label')).toContain('AI Ling');
      expect(fab().getAttribute('aria-haspopup')).toBe('dialog');
      expect(panel()).toBeNull();

      const img = fab().querySelector('img')!;
      expect(img).not.toBeNull();
      expect(img.getAttribute('src')).toContain('chat_avatar_352x432.png');
      expect(img.getAttribute('width')).toBeTruthy();
      expect(img.getAttribute('height')).toBeTruthy();
    });

    it('overlays the FAB with a decorative AI star badge', () => {
      const badge = el().querySelector('.chat-launcher .chat-fab-badge');

      expect(badge).not.toBeNull();
      expect(badge?.textContent?.trim()).toBe('auto_awesome');
      expect(badge?.getAttribute('aria-hidden')).toBe('true');
    });

    it('explains the assistant in a hover tooltip', () => {
      const tip = el().querySelector('#chat-fab-tip');

      expect(tip?.getAttribute('role')).toBe('tooltip');
      expect(tip?.textContent).toMatch(/questions about Thanik/i);
      expect(tip?.textContent).toContain('AI Ling');
      expect(tip?.textContent).not.toMatch(/\bbot\b/i);
      expect(fab().getAttribute('aria-describedby')).toBe('chat-fab-tip');
    });

    // Hover has no touch equivalent, so the tip reveals itself once on arrival and
    // then retires: after the chat has been opened the visitor knows what it is.
    it('peeks the tooltip until the chat has been opened', () => {
      const tip = () => el().querySelector('#chat-fab-tip')!;
      expect(tip().classList.contains('chat-fab-tip-peek')).toBe(true);

      openPanel();
      panelInstance().close.emit();
      fixture.detectChanges();

      expect(tip().classList.contains('chat-fab-tip-peek')).toBe(false);
    });

    it('opens the panel and removes the launcher when clicked', () => {
      openPanel();

      expect(panel()).not.toBeNull();
      expect(el().querySelector('button.chat-fab')).toBeNull();
    });

    it('restores the launcher after the panel closes', () => {
      openPanel();
      panelInstance().close.emit();
      fixture.detectChanges();

      expect(panel()).toBeNull();
      expect(el().querySelector('button.chat-fab')).not.toBeNull();
    });

    it('opens through ChatService without asking anything', () => {
      openPanel();

      expect(mockChatService.open).toHaveBeenCalledWith();
    });

    // Contextual "Ask AI Ling" links elsewhere on the page open the chat through
    // the service; the widget must follow, even though it never saw the click.
    it('shows the panel when the chat is opened from elsewhere', () => {
      isOpen.set(true);
      fixture.detectChanges();

      expect(panel()).not.toBeNull();
      expect(el().querySelector('button.chat-fab')).toBeNull();
    });

    it('retires the tooltip peek when the chat is opened from elsewhere', () => {
      isOpen.set(true);
      fixture.detectChanges();
      isOpen.set(false);
      fixture.detectChanges();

      expect(el().querySelector('#chat-fab-tip')!.classList.contains('chat-fab-tip-peek')).toBe(
        false,
      );
    });

    it('returns focus to the link that opened the chat', async () => {
      const opener = document.createElement('button');
      document.body.appendChild(opener);
      opener.focus();

      isOpen.set(true);
      fixture.detectChanges();
      panelInstance().close.emit();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(mockChatService.close).toHaveBeenCalled();
      expect(document.activeElement).toBe(opener);
      opener.remove();
    });

    it('colours the widget from theme tokens, not the Tailwind palette', () => {
      openPanel();

      expect(paletteClassesIn(el())).toEqual([]);
    });
  });

  describe('panel wiring', () => {
    beforeEach(openPanel);

    it('passes the service state into the panel', () => {
      const conversation: ChatTurn[] = [{ role: 'user', content: 'Hello' }];
      turns.set(conversation);
      pending.set(true);
      error.set('Oops');
      fixture.detectChanges();

      expect(panelInstance().turns()).toEqual(conversation);
      expect(panelInstance().pending()).toBe(true);
      expect(panelInstance().error()).toBe('Oops');
    });

    it('forwards send to ChatService.send', () => {
      panelInstance().send.emit('Where does Thanik work?');

      expect(mockChatService.send).toHaveBeenCalledWith('Where does Thanik work?');
    });

    it('forwards retry to ChatService.retry', () => {
      panelInstance().retry.emit();

      expect(mockChatService.retry).toHaveBeenCalledTimes(1);
    });

    it('traps focus inside the open panel', () => {
      const trap = fixture.debugElement.query(By.directive(CdkTrapFocus));

      expect(trap).not.toBeNull();
      expect(trap.nativeElement.contains(panel().nativeElement)).toBe(true);
    });

    it('closes on the panel close event and returns focus to the FAB', async () => {
      panelInstance().close.emit();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(fab());
    });

    it('closes when the backdrop is clicked', async () => {
      el().querySelector<HTMLElement>('.chat-scrim')!.click();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(panel()).toBeNull();
      expect(document.activeElement).toBe(fab());
    });

    it('keeps the conversation when the panel is closed', () => {
      panelInstance().close.emit();
      fixture.detectChanges();

      expect(mockChatService.reset).not.toHaveBeenCalled();
    });
  });
});
