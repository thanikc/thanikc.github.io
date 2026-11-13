import { DOCUMENT } from '@angular/common';
import { Injectable, LOCALE_ID, inject, signal } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { CHAT_API_URL } from './chat.config';
import {
  CHAT_ERROR_MESSAGE,
  CHAT_HISTORY_LIMIT,
  CHAT_RATE_LIMITED_MESSAGE,
  CHAT_STORAGE_KEY,
} from './chat.constants';
import { ChatRequest, ChatResponse, ChatSource, ChatTurn } from './chat.models';
import { TurnstileService } from './turnstile.service';
import { DEFAULT_LOCALE, matchLocaleTag } from '../../shared/i18n/locales';

/**
 * The last `CHAT_HISTORY_LIMIT` turns, which is all the worker needs for follow-ups —
 * as plain role/content pairs plus the worker's signature on its own answers: source
 * titles are for display, not for the model.
 */
const recent = (turns: ChatTurn[]): ChatTurn[] =>
  turns
    .slice(-CHAT_HISTORY_LIMIT)
    .map(({ role, content, answerSig }) => ({ role, content, ...(answerSig && { answerSig }) }));

/** Distinct source titles in retrieval order; chunks without a title are skipped. */
const titlesOf = (sources: ChatSource[] = []): string[] => [
  ...new Set(sources.flatMap(source => (source.title ? [source.title] : []))),
];

const isTurn = (value: unknown): value is ChatTurn =>
  typeof value === 'object' &&
  value !== null &&
  ['user', 'assistant'].includes((value as ChatTurn).role) &&
  typeof (value as ChatTurn).content === 'string';

/**
 * The conversation a previous page load left in session storage. A trailing question is
 * dropped: its request died with that page, and without an error nothing offers a retry.
 */
function restore(storage: Storage | undefined): ChatTurn[] {
  try {
    const stored: unknown = JSON.parse(storage?.getItem(CHAT_STORAGE_KEY) ?? '[]');
    if (!Array.isArray(stored) || !stored.every(isTurn)) return [];
    return stored.at(-1)?.role === 'user' ? stored.slice(0, -1) : stored;
  } catch {
    return [];
  }
}

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

  /** Absent while prerendering, and reading it throws where the browser blocks storage. */
  private readonly storage = ((view: Window | null) => {
    try {
      return view?.sessionStorage;
    } catch {
      return undefined;
    }
  })(inject(DOCUMENT).defaultView);

  readonly turns = signal<ChatTurn[]>(restore(this.storage));
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
    this.append({ role: 'user', content });
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

  /** Adds a turn and keeps session storage in step, so a reload or language switch keeps the conversation. */
  private append(turn: ChatTurn): void {
    this.turns.update(turns => [...turns, turn]);
    try {
      this.storage?.setItem(CHAT_STORAGE_KEY, JSON.stringify(this.turns()));
    } catch {
      // Full or blocked storage only costs the conversation its survival across a reload.
    }
  }

  private async ask(request: ChatRequest): Promise<void> {
    this.pending.set(true);
    this.error.set(null);

    try {
      const { answer, sources, answerSig } = await this.post(request);
      const titles = titlesOf(sources);
      this.append({
        role: 'assistant',
        content: answer,
        ...(titles.length > 0 && { sources: titles }),
        ...(answerSig && { answerSig }),
      });
    } catch (error) {
      const response = error instanceof HttpErrorResponse ? error : null;
      // The kill switch (503) explains itself in the visitor's language; retrying won't help.
      const explained: unknown = response?.error?.answer;
      if (typeof explained === 'string') {
        this.append({ role: 'assistant', content: explained });
      } else {
        this.error.set(response?.status === 429 ? CHAT_RATE_LIMITED_MESSAGE : CHAT_ERROR_MESSAGE);
      }
    } finally {
      this.pending.set(false);
    }
  }
}
