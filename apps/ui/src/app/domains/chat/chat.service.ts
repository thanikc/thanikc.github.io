import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CHAT_API_URL } from './chat.config';
import { CHAT_ERROR_MESSAGE, CHAT_HISTORY_LIMIT } from './chat.constants';
import { ChatRequest, ChatResponse, ChatTurn } from './chat.models';

/** The last `CHAT_HISTORY_LIMIT` turns, which is all the worker needs for follow-ups. */
const recent = (turns: ChatTurn[]): ChatTurn[] => turns.slice(-CHAT_HISTORY_LIMIT);

/** Conversation state for the résumé chatbot, backed by the worker's `/api/chat`. */
@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${inject(CHAT_API_URL)}/api/chat`;

  readonly turns = signal<ChatTurn[]>([]);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);
  readonly hasConversation = computed(() => this.turns().length > 0);

  /**
   * Whether the chat panel is showing. Lives here rather than in the widget so any
   * part of the page can open the chat — including before the idle-deferred widget
   * has loaded, which then renders straight into the open state.
   */
  readonly isOpen = signal(false);

  /** Opens the panel; with a `question`, also asks it (contextual "Ask AI Ling" links). */
  open(question?: string): void {
    this.isOpen.set(true);
    if (question) void this.send(question);
  }

  close(): void {
    this.isOpen.set(false);
  }

  /** Appends `message` as a user turn and asks the worker to answer it. */
  async send(message: string): Promise<void> {
    const content = message.trim();
    if (content === '' || this.pending()) return;

    const history = recent(this.turns());
    this.turns.update(turns => [...turns, { role: 'user', content }]);
    await this.ask({ message: content, history });
  }

  /** Re-asks the trailing user turn after a failed request. */
  async retry(): Promise<void> {
    const turns = this.turns();
    const last = turns.at(-1);
    if (last?.role !== 'user' || this.pending()) return;

    await this.ask({ message: last.content, history: recent(turns.slice(0, -1)) });
  }

  reset(): void {
    this.turns.set([]);
    this.error.set(null);
  }

  private async ask(request: ChatRequest): Promise<void> {
    this.pending.set(true);
    this.error.set(null);

    try {
      const { answer } = await firstValueFrom(this.http.post<ChatResponse>(this.endpoint, request));
      this.turns.update(turns => [...turns, { role: 'assistant', content: answer }]);
    } catch {
      this.error.set(CHAT_ERROR_MESSAGE);
    } finally {
      this.pending.set(false);
    }
  }
}
