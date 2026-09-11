import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DeferBlockBehavior, DeferBlockState } from '@angular/core/testing';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { ChatShellComponent } from './chat-shell.component';
import { ChatService } from './chat.service';
import { ChatTurn } from './chat.models';

describe('ChatShellComponent', () => {
  let fixture: ComponentFixture<ChatShellComponent>;

  const mockChatService = {
    turns: signal<ChatTurn[]>([]),
    pending: signal(false),
    error: signal<string | null>(null),
    hasConversation: signal(false),
    send: vi.fn(),
    retry: vi.fn(),
    reset: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChatShellComponent],
      providers: [{ provide: ChatService, useValue: mockChatService }],
      deferBlockBehavior: DeferBlockBehavior.Manual,
    }).compileComponents();

    fixture = TestBed.createComponent(ChatShellComponent);
    fixture.detectChanges();
  });

  // The prerendered HTML is the placeholder state: no widget yet, but a static,
  // always-rendered sr-only blurb so crawlers that never run JS (AEO bots) still
  // learn the assistant exists.
  it('renders a static sr-only blurb but not the widget before the defer block completes', () => {
    expect(fixture.nativeElement.querySelector('app-chat-widget')).toBeNull();
    const blurb = fixture.nativeElement.querySelector('.sr-only');
    expect(blurb).not.toBeNull();
    expect(blurb.textContent).toContain("Thanik's professional experience");
    expect(blurb.textContent).toContain('AI Ling');
  });

  it('renders the chat widget once the defer block completes', async () => {
    const [deferBlock] = await fixture.getDeferBlocks();
    await deferBlock.render(DeferBlockState.Complete);

    expect(fixture.nativeElement.querySelector('app-chat-widget')).not.toBeNull();
  });
});
