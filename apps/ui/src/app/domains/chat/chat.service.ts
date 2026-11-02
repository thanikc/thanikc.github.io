import { Injectable, LOCALE_ID, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CHAT_API_URL } from './chat.config';
import { CHAT_ERROR_MESSAGE, CHAT_HISTORY_LIMIT } from './chat.constants';
import { ChatRequest, ChatResponse, ChatSource, ChatTurn } from './chat.models';
import { TurnstileService } from './turnstile.service';
import { DEFAULT_LOCALE, matchLocaleTag } from '../../shared/i18n/locales';

/**
 * The last `CHAT_HISTORY_LIMIT` turns, which is all the worker needs for follow-ups —
 * as plain role/content pairs: source titles are for display, not for the model.
 */
const recent = (turns: ChatTurn[]): ChatTurn[] =>
  turns.slice(-CHAT_HISTORY_LIMIT).map(({ role, content }) => ({ role, content }));

/** Distinct source titles in retrieval order; chunks without a title are skipped. */
const titlesOf = (sources: ChatSource[] = []): string[] => [
  ...new Set(sources.flatMap(source => (source.title ? [source.title] : []))),
];

/** Conversation state for AI Ling, backed by the worker's `/api/chat`. */
@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private readonly http = inject(HttpClient);
  private readonly turnstile = inject(TurnstileService);
  private readonly endpoint = `${inject(CHAT_API_URL)}/api/chat`;
  /** The language the page is being read in; the worker answers in it. */
  private readonly locale = matchLocaleTag(inject(LOCALE_ID)) ?? DEFAULT_LOCALE;

  /** Short-lived session the worker issues after a Turnstile check; nothing renders it. */
  private session: string | null = null;

  readonly turns = signal<ChatTurn[]>([]);
  readonly pending = signal(false);
  readonly error = signal<string | null>(null);

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
    await this.ask({ message: content, history, locale: this.locale });
  }

  /** Re-asks the trailing user turn after a failed request. */
  async retry(): Promise<void> {
    const turns = this.turns();
    const last = turns.at(-1);
    if (last?.role !== 'user' || this.pending()) return;

    await this.ask({
      message: last.content,
      history: recent(turns.slice(0, -1)),
      locale: this.locale,
    });
  }

  /** Posts with the session, or a fresh Turnstile token; a rejected session is retried once. */
  private async post(request: ChatRequest): Promise<ChatResponse> {
    const hadSession = this.session !== null;
    const headers: Record<string, string> = this.session
      ? { 'X-Chat-Session': this.session }
      : { 'X-Turnstile-Token': await this.turnstile.token() };
    try {
      const res = await firstValueFrom(
        this.http.post<ChatResponse>(this.endpoint, request, { headers, observe: 'response' }),
      );
      this.session = res.headers.get('X-Chat-Session') ?? this.session;
      return res.body!;
    } catch (error) {
      if (hadSession && error instanceof HttpErrorResponse && error.status === 403) {
        this.session = null;
        return this.post(request);
      }
      throw error;
    }
  }

  private async ask(request: ChatRequest): Promise<void> {
    this.pending.set(true);
    this.error.set(null);

    try {
      const { answer, sources } = await this.post(request);
      const titles = titlesOf(sources);
      this.turns.update(turns => [
        ...turns,
        { role: 'assistant', content: answer, ...(titles.length > 0 && { sources: titles }) },
      ]);
    } catch {
      this.error.set(CHAT_ERROR_MESSAGE);
    } finally {
      this.pending.set(false);
    }
  }
}
