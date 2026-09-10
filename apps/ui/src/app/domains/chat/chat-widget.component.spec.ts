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
  const mockChatService = {
    turns,
    pending,
    error,
    hasConversation: signal(false),
    send: vi.fn(async (_message: string) => undefined),
    retry: vi.fn(async () => undefined),
    reset: vi.fn(),
  };

  const el = () => fixture.nativeElement as HTMLElement;
  const fab = () => el().querySelector<HTMLButtonElement>('button.chat-fab')!;
  const panel = () => fixture.debugElement.query(By.directive(ChatPanelComponent));
  const panelInstance = () => panel().componentInstance as ChatPanelComponent;

  const openPanel = () => {
    fab().click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    turns.set([]);
    pending.set(false);
    error.set(null);
    mockChatService.send.mockClear();
    mockChatService.retry.mockClear();

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
  });

  describe('launcher', () => {
    it('renders a labelled FAB and no panel initially', () => {
      expect(fab().type).toBe('button');
      expect(fab().getAttribute('aria-label')).toBeTruthy();
      expect(panel()).toBeNull();
    });

    it('toggles the panel open and closed', () => {
      openPanel();
      expect(panel()).not.toBeNull();

      fab().click();
      fixture.detectChanges();
      expect(panel()).toBeNull();
    });

    it('tracks the open state with aria-expanded', () => {
      expect(fab().getAttribute('aria-expanded')).toBe('false');

      openPanel();
      expect(fab().getAttribute('aria-expanded')).toBe('true');
    });

    it('points aria-controls at the panel while it is open', () => {
      openPanel();
      const id = fab().getAttribute('aria-controls');

      expect(id).toBeTruthy();
      expect(el().querySelector(`#${id}`)?.contains(panel().nativeElement)).toBe(true);
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

    it('closes on the panel close event and returns focus to the FAB', () => {
      panelInstance().close.emit();
      fixture.detectChanges();

      expect(panel()).toBeNull();
      expect(fab().getAttribute('aria-expanded')).toBe('false');
      expect(document.activeElement).toBe(fab());
    });

    it('closes when the backdrop is clicked', () => {
      el().querySelector<HTMLElement>('.chat-scrim')!.click();
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
