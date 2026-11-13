import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { LOCALE_ID } from '@angular/core';
import { ChatService } from './chat.service';
import { CHAT_API_URL } from './chat.config';
import { CHAT_ERROR_MESSAGE, CHAT_RATE_LIMITED_MESSAGE, CHAT_STORAGE_KEY } from './chat.constants';
import { ChatResponse, ChatTurn } from './chat.models';
import { TurnstileService } from './turnstile.service';

const API_URL = 'https://chat.test';
const CHAT_ENDPOINT = `${API_URL}/api/chat`;

const answer = (text: string): ChatResponse => ({ answer: text, provider: 'groq', sources: [] });

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;
  const turnstile = { token: vi.fn() };

  /** The request goes out after the Turnstile token resolves, so give that a turn first. */
  const nextRequest = async () => {
    await new Promise(resolve => setTimeout(resolve));
    return httpMock.expectOne(CHAT_ENDPOINT);
  };

  beforeEach(() => {
    sessionStorage.clear();
    turnstile.token.mockReset().mockResolvedValue('tok');
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CHAT_API_URL, useValue: API_URL },
        { provide: LOCALE_ID, useValue: 'de' },
        { provide: TurnstileService, useValue: turnstile },
      ],
    });

    service = TestBed.inject(ChatService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  /** Sends `message` and answers it, leaving one completed exchange in the transcript. */
  const exchange = async (message: string, reply: string) => {
    const done = service.send(message);
    (await nextRequest()).flush(answer(reply));
    await done;
  };

  it('starts with an empty, idle conversation', () => {
    expect(service.turns()).toEqual([]);
    expect(service.pending()).toBe(false);
    expect(service.error()).toBeNull();
  });

  it('posts the message and an empty history to the configured chat endpoint', async () => {
    const done = service.send('Where does Thanik work?');

    const req = await nextRequest();
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      message: 'Where does Thanik work?',
      history: [],
      locale: 'de',
    });

    req.flush(answer('At a consultancy.'));
    await done;
  });

  it('trims the message before sending it', async () => {
    const done = service.send('  Hello  ');

    const req = await nextRequest();
    expect(req.request.body.message).toBe('Hello');
    expect(service.turns()).toEqual([{ role: 'user', content: 'Hello' }]);

    req.flush(answer('Hi'));
    await done;
  });

  it('appends the user turn immediately, before the response arrives', async () => {
    const done = service.send('Hello');

    expect(service.turns()).toEqual([{ role: 'user', content: 'Hello' }]);

    (await nextRequest()).flush(answer('Hi there'));
    await done;
  });

  it('records the distinct source titles an answer looked in, in retrieval order', async () => {
    const done = service.send('What has Thanik built?');
    (await nextRequest()).flush({
      answer: 'Two banking products.',
      provider: 'groq',
      sources: [
        { score: 0.9, title: 'Projects' },
        { score: 0.8, title: 'Experience' },
        { score: 0.7, title: 'Projects' },
        { score: 0.6 },
      ],
    } satisfies ChatResponse);
    await done;

    expect(service.turns().at(-1)).toEqual({
      role: 'assistant',
      content: 'Two banking products.',
      sources: ['Projects', 'Experience'],
    });
  });

  it("sends the worker's signature back with the assistant turn it belongs to", async () => {
    const first = service.send('Hello');
    (await nextRequest()).flush({ ...answer('Hi'), answerSig: 'sig-1' });
    await first;

    expect(service.turns().at(-1)).toEqual({
      role: 'assistant',
      content: 'Hi',
      answerSig: 'sig-1',
    });

    const done = service.send('And then?');
    const req = await nextRequest();
    expect(req.request.body.history).toEqual([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi', answerSig: 'sig-1' },
    ]);

    req.flush(answer('More'));
    await done;
  });

  it('keeps history free of source titles', async () => {
    const first = service.send('Hello');
    (await nextRequest()).flush({
      answer: 'Hi',
      provider: 'groq',
      sources: [{ score: 0.9, title: 'Summary' }],
    } satisfies ChatResponse);
    await first;

    const done = service.send('And then?');
    const req = await nextRequest();
    expect(req.request.body.history).toEqual([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi' },
    ]);

    req.flush(answer('More'));
    await done;
  });

  it('appends the assistant turn on success', async () => {
    await exchange('Hello', 'Hi there');

    expect(service.turns()).toEqual([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ]);
  });

  it('is pending while the request is in flight and idle afterwards', async () => {
    const done = service.send('Hello');
    expect(service.pending()).toBe(true);

    (await nextRequest()).flush(answer('Hi'));
    await done;

    expect(service.pending()).toBe(false);
  });

  it('ignores a send while a request is already in flight', async () => {
    const done = service.send('First');
    await service.send('Second');

    const req = await nextRequest();
    expect(service.turns()).toEqual([{ role: 'user', content: 'First' }]);

    req.flush(answer('Reply'));
    await done;
  });

  it.each(['', '   ', '\n\t'])('treats %j as a no-op', async message => {
    await service.send(message);

    httpMock.expectNone(CHAT_ENDPOINT);
    expect(service.turns()).toEqual([]);
    expect(service.pending()).toBe(false);
  });

  it('sets an error when every provider fails (502) and stays idle', async () => {
    const done = service.send('Hello');
    (await nextRequest()).flush(
      { error: 'could not generate an answer' },
      { status: 502, statusText: 'Bad Gateway' },
    );
    await done;

    expect(service.error()).toEqual(expect.any(String));
    expect(service.error()).not.toBe('');
    expect(service.pending()).toBe(false);
    // The question stays visible so it can be retried.
    expect(service.turns()).toEqual([{ role: 'user', content: 'Hello' }]);
  });

  // The kill switch answers 503 with a message in the visitor's language; retrying won't help.
  it("shows the worker's own message when the chat is switched off", async () => {
    const done = service.send('Hello');
    (await nextRequest()).flush(
      { error: 'disabled', answer: 'AI Ling ist vorübergehend abgeschaltet.' },
      { status: 503, statusText: 'Service Unavailable' },
    );
    await done;

    expect(service.error()).toBeNull();
    expect(service.turns().at(-1)).toEqual({
      role: 'assistant',
      content: 'AI Ling ist vorübergehend abgeschaltet.',
    });
  });

  it('says to wait, not that the answer failed, when rate limited', async () => {
    const done = service.send('Hello');
    (await nextRequest()).flush(
      { error: 'rate limited' },
      { status: 429, statusText: 'Too Many Requests' },
    );
    await done;

    expect(service.error()).toBe(CHAT_RATE_LIMITED_MESSAGE);
    expect(CHAT_RATE_LIMITED_MESSAGE).not.toBe(CHAT_ERROR_MESSAGE);
  });

  it('sets an error on a network failure', async () => {
    const done = service.send('Hello');
    (await nextRequest()).error(new ProgressEvent('error'));
    await done;

    expect(service.error()).toEqual(expect.any(String));
  });

  it('clears the error on the next send', async () => {
    const failed = service.send('Hello');
    (await nextRequest()).flush({ error: 'down' }, { status: 502, statusText: 'Bad Gateway' });
    await failed;
    expect(service.error()).not.toBeNull();

    const done = service.send('Hello again');
    expect(service.error()).toBeNull();

    (await nextRequest()).flush(answer('Back up'));
    await done;
    expect(service.error()).toBeNull();
  });

  it('sends prior turns as history, excluding the in-flight user turn', async () => {
    await exchange('Hello', 'Hi there');

    const done = service.send('Where does Thanik work?');
    const req = await nextRequest();

    expect(req.request.body).toEqual({
      message: 'Where does Thanik work?',
      history: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ],
      locale: 'de',
    });

    req.flush(answer('At a consultancy.'));
    await done;
  });

  it('caps the history to the last 6 turns', async () => {
    for (let i = 1; i <= 4; i++) {
      await exchange(`q${i}`, `a${i}`);
    }

    const done = service.send('q5');
    const req = await nextRequest();
    const history = req.request.body.history as ChatTurn[];

    expect(history).toHaveLength(6);
    expect(history.map(t => t.content)).toEqual(['q2', 'a2', 'q3', 'a3', 'q4', 'a4']);

    req.flush(answer('a5'));
    await done;
  });

  it('retries the failed question without duplicating the user turn', async () => {
    await exchange('Hello', 'Hi there');

    const failed = service.send('Where does Thanik work?');
    (await nextRequest()).flush({ error: 'down' }, { status: 502, statusText: 'Bad Gateway' });
    await failed;

    const retried = service.retry();
    expect(service.error()).toBeNull();
    expect(service.pending()).toBe(true);

    const req = await nextRequest();
    expect(req.request.body).toEqual({
      message: 'Where does Thanik work?',
      history: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ],
      locale: 'de',
    });

    req.flush(answer('At a consultancy.'));
    await retried;

    expect(service.turns().map(t => t.content)).toEqual([
      'Hello',
      'Hi there',
      'Where does Thanik work?',
      'At a consultancy.',
    ]);
  });

  it('does nothing on retry when there is no unanswered question', async () => {
    await service.retry();
    httpMock.expectNone(CHAT_ENDPOINT);

    await exchange('Hello', 'Hi there');
    await service.retry();
    httpMock.expectNone(CHAT_ENDPOINT);
  });

  describe('Turnstile verification', () => {
    const forbidden = { status: 403, statusText: 'Forbidden' };

    it('sends a Turnstile token on the first request', async () => {
      const done = service.send('Hello');
      const req = await nextRequest();

      expect(req.request.headers.get('X-Turnstile-Token')).toBe('tok');
      expect(req.request.headers.has('X-Chat-Session')).toBe(false);

      req.flush(answer('Hi'));
      await done;
    });

    it('sends the session from the previous answer instead of a new token', async () => {
      const first = service.send('Hello');
      (await nextRequest()).flush(answer('Hi'), { headers: { 'X-Chat-Session': 's1' } });
      await first;

      const done = service.send('Again');
      const req = await nextRequest();

      expect(req.request.headers.get('X-Chat-Session')).toBe('s1');
      expect(req.request.headers.has('X-Turnstile-Token')).toBe(false);
      expect(turnstile.token).toHaveBeenCalledTimes(1);

      req.flush(answer('Hi again'));
      await done;
    });

    it('re-verifies once when the session is rejected', async () => {
      const first = service.send('Hello');
      (await nextRequest()).flush(answer('Hi'), { headers: { 'X-Chat-Session': 's1' } });
      await first;

      const done = service.send('Again');
      (await nextRequest()).flush({ error: 'verification required' }, forbidden);
      const retry = await nextRequest();

      expect(retry.request.headers.get('X-Turnstile-Token')).toBe('tok');
      expect(retry.request.headers.has('X-Chat-Session')).toBe(false);

      retry.flush(answer('Back'));
      await done;
      expect(service.error()).toBeNull();
      expect(service.turns().at(-1)).toEqual({ role: 'assistant', content: 'Back' });
    });

    it('shows the error when verification fails twice', async () => {
      const first = service.send('Hello');
      (await nextRequest()).flush(answer('Hi'), { headers: { 'X-Chat-Session': 's1' } });
      await first;

      const done = service.send('Again');
      (await nextRequest()).flush({ error: 'verification required' }, forbidden);
      (await nextRequest()).flush({ error: 'verification required' }, forbidden);
      await done;

      expect(service.error()).toBe(CHAT_ERROR_MESSAGE);
    });

    it('shows the error and stops pending when no token can be obtained', async () => {
      turnstile.token.mockRejectedValue(new Error('Turnstile timed out'));

      await service.send('Hello');

      expect(service.error()).toBe(CHAT_ERROR_MESSAGE);
      expect(service.pending()).toBe(false);
    });
  });

  describe('panel visibility', () => {
    it('starts closed', () => {
      expect(service.isOpen()).toBe(false);
    });

    it('opens without asking anything', () => {
      service.open();

      expect(service.isOpen()).toBe(true);
      httpMock.expectNone(CHAT_ENDPOINT);
      expect(service.turns()).toEqual([]);
    });

    // Contextual "Ask AI Ling" links open the panel with their question already asked.
    it('opens and asks the given question', async () => {
      service.open('What has Thanik built from scratch?');

      expect(service.isOpen()).toBe(true);
      const req = await nextRequest();
      expect(req.request.body.message).toBe('What has Thanik built from scratch?');

      req.flush(answer('Two banking products.'));
      await Promise.resolve();
    });

    it('closes and keeps the conversation', async () => {
      await exchange('Hello', 'Hi there');
      service.open();

      service.close();

      expect(service.isOpen()).toBe(false);
      expect(service.turns()).toHaveLength(2);
    });
  });
});

describe('ChatService persistence', () => {
  const setup = () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CHAT_API_URL, useValue: API_URL },
        { provide: TurnstileService, useValue: { token: vi.fn().mockResolvedValue('tok') } },
      ],
    });
    return {
      service: TestBed.inject(ChatService),
      httpMock: TestBed.inject(HttpTestingController),
    };
  };

  const ANSWERED: ChatTurn[] = [
    { role: 'user', content: 'Where does Thanik work?' },
    { role: 'assistant', content: 'At a consultancy.', sources: ['Experience'], answerSig: 'sig' },
  ];

  beforeEach(() => sessionStorage.clear());

  // A reload or a language switch (a full navigation) must not throw the conversation away.
  it('keeps the conversation in session storage as it grows', async () => {
    const { service, httpMock } = setup();

    const done = service.send('Where does Thanik work?');
    await new Promise(resolve => setTimeout(resolve));
    httpMock.expectOne(CHAT_ENDPOINT).flush({
      answer: 'At a consultancy.',
      provider: 'groq',
      sources: [{ title: 'Experience', score: 0.9 }],
      answerSig: 'sig',
    });
    await done;
    TestBed.tick();

    expect(JSON.parse(sessionStorage.getItem(CHAT_STORAGE_KEY)!)).toEqual(ANSWERED);
  });

  it('restores the conversation in a new page load', () => {
    sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(ANSWERED));

    expect(setup().service.turns()).toEqual(ANSWERED);
  });

  // Its request died with the old page, and without an error there is no retry button.
  it('drops a trailing question that never got its answer', () => {
    sessionStorage.setItem(
      CHAT_STORAGE_KEY,
      JSON.stringify([...ANSWERED, { role: 'user', content: 'Since when?' }]),
    );

    expect(setup().service.turns()).toEqual(ANSWERED);
  });

  it('starts empty when the stored value is not a list of turns', () => {
    for (const stored of ['{not json', '{"role":"user"}', '[{"role":"system","content":"x"}]']) {
      sessionStorage.setItem(CHAT_STORAGE_KEY, stored);

      expect(setup().service.turns()).toEqual([]);
    }
  });
});

describe('ChatService language', () => {
  // The worker answers in the language the page is being read in, so the visitor
  // is not handed an English answer under a German question.
  it('tells the worker which language to answer in', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CHAT_API_URL, useValue: API_URL },
        { provide: LOCALE_ID, useValue: 'th' },
        { provide: TurnstileService, useValue: { token: vi.fn().mockResolvedValue('tok') } },
      ],
    });

    const service = TestBed.inject(ChatService);
    const httpMock = TestBed.inject(HttpTestingController);

    const done = service.send('Hello');
    await new Promise(resolve => setTimeout(resolve));
    const req = httpMock.expectOne(CHAT_ENDPOINT);

    expect(req.request.body.locale).toBe('th');

    req.flush(answer('Hi'));
    await done;
    httpMock.verify();
  });
});
