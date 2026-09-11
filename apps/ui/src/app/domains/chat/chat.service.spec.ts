import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ChatService } from './chat.service';
import { CHAT_API_URL } from './chat.config';
import { ChatResponse, ChatTurn } from './chat.models';

const API_URL = 'https://chat.test';
const CHAT_ENDPOINT = `${API_URL}/api/chat`;

const answer = (text: string): ChatResponse => ({ answer: text, provider: 'groq', sources: [] });

describe('ChatService', () => {
  let service: ChatService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: CHAT_API_URL, useValue: API_URL },
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
    httpMock.expectOne(CHAT_ENDPOINT).flush(answer(reply));
    await done;
  };

  it('starts with an empty, idle conversation', () => {
    expect(service.turns()).toEqual([]);
    expect(service.pending()).toBe(false);
    expect(service.error()).toBeNull();
    expect(service.hasConversation()).toBe(false);
  });

  it('posts the message and an empty history to the configured chat endpoint', async () => {
    const done = service.send('Where does Thanik work?');

    const req = httpMock.expectOne(CHAT_ENDPOINT);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ message: 'Where does Thanik work?', history: [] });

    req.flush(answer('At a consultancy.'));
    await done;
  });

  it('trims the message before sending it', async () => {
    const done = service.send('  Hello  ');

    const req = httpMock.expectOne(CHAT_ENDPOINT);
    expect(req.request.body.message).toBe('Hello');
    expect(service.turns()).toEqual([{ role: 'user', content: 'Hello' }]);

    req.flush(answer('Hi'));
    await done;
  });

  it('appends the user turn immediately, before the response arrives', async () => {
    const done = service.send('Hello');

    expect(service.turns()).toEqual([{ role: 'user', content: 'Hello' }]);
    expect(service.hasConversation()).toBe(true);

    httpMock.expectOne(CHAT_ENDPOINT).flush(answer('Hi there'));
    await done;
  });

  it('records the distinct source titles an answer looked in, in retrieval order', async () => {
    const done = service.send('What has Thanik built?');
    httpMock.expectOne(CHAT_ENDPOINT).flush({
      answer: 'Two banking products.',
      provider: 'groq',
      sources: [
        { text: 'a', score: 0.9, title: 'Projects' },
        { text: 'b', score: 0.8, title: 'Experience' },
        { text: 'c', score: 0.7, title: 'Projects' },
        { text: 'd', score: 0.6 },
      ],
    } satisfies ChatResponse);
    await done;

    expect(service.turns().at(-1)).toEqual({
      role: 'assistant',
      content: 'Two banking products.',
      sources: ['Projects', 'Experience'],
    });
  });

  it('keeps history free of source titles', async () => {
    const first = service.send('Hello');
    httpMock.expectOne(CHAT_ENDPOINT).flush({
      answer: 'Hi',
      provider: 'groq',
      sources: [{ text: 'a', score: 0.9, title: 'Summary' }],
    } satisfies ChatResponse);
    await first;

    const done = service.send('And then?');
    const req = httpMock.expectOne(CHAT_ENDPOINT);
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

    httpMock.expectOne(CHAT_ENDPOINT).flush(answer('Hi'));
    await done;

    expect(service.pending()).toBe(false);
  });

  it('ignores a send while a request is already in flight', async () => {
    const done = service.send('First');
    await service.send('Second');

    const req = httpMock.expectOne(CHAT_ENDPOINT);
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
    httpMock
      .expectOne(CHAT_ENDPOINT)
      .flush(
        { error: 'all providers failed', attempts: ['groq: 500'] },
        { status: 502, statusText: 'Bad Gateway' },
      );
    await done;

    expect(service.error()).toEqual(expect.any(String));
    expect(service.error()).not.toBe('');
    expect(service.pending()).toBe(false);
    // The question stays visible so it can be retried.
    expect(service.turns()).toEqual([{ role: 'user', content: 'Hello' }]);
  });

  it('sets an error on a network failure', async () => {
    const done = service.send('Hello');
    httpMock.expectOne(CHAT_ENDPOINT).error(new ProgressEvent('error'));
    await done;

    expect(service.error()).toEqual(expect.any(String));
  });

  it('clears the error on the next send', async () => {
    const failed = service.send('Hello');
    httpMock
      .expectOne(CHAT_ENDPOINT)
      .flush({ error: 'down' }, { status: 502, statusText: 'Bad Gateway' });
    await failed;
    expect(service.error()).not.toBeNull();

    const done = service.send('Hello again');
    expect(service.error()).toBeNull();

    httpMock.expectOne(CHAT_ENDPOINT).flush(answer('Back up'));
    await done;
    expect(service.error()).toBeNull();
  });

  it('sends prior turns as history, excluding the in-flight user turn', async () => {
    await exchange('Hello', 'Hi there');

    const done = service.send('Where does Thanik work?');
    const req = httpMock.expectOne(CHAT_ENDPOINT);

    expect(req.request.body).toEqual({
      message: 'Where does Thanik work?',
      history: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ],
    });

    req.flush(answer('At a consultancy.'));
    await done;
  });

  it('caps the history to the last 6 turns', async () => {
    for (let i = 1; i <= 4; i++) {
      await exchange(`q${i}`, `a${i}`);
    }

    const done = service.send('q5');
    const req = httpMock.expectOne(CHAT_ENDPOINT);
    const history = req.request.body.history as ChatTurn[];

    expect(history).toHaveLength(6);
    expect(history.map(t => t.content)).toEqual(['q2', 'a2', 'q3', 'a3', 'q4', 'a4']);

    req.flush(answer('a5'));
    await done;
  });

  it('retries the failed question without duplicating the user turn', async () => {
    await exchange('Hello', 'Hi there');

    const failed = service.send('Where does Thanik work?');
    httpMock
      .expectOne(CHAT_ENDPOINT)
      .flush({ error: 'down' }, { status: 502, statusText: 'Bad Gateway' });
    await failed;

    const retried = service.retry();
    expect(service.error()).toBeNull();
    expect(service.pending()).toBe(true);

    const req = httpMock.expectOne(CHAT_ENDPOINT);
    expect(req.request.body).toEqual({
      message: 'Where does Thanik work?',
      history: [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there' },
      ],
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
      const req = httpMock.expectOne(CHAT_ENDPOINT);
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

  it('resets the conversation', async () => {
    const failed = service.send('Hello');
    httpMock
      .expectOne(CHAT_ENDPOINT)
      .flush({ error: 'down' }, { status: 502, statusText: 'Bad Gateway' });
    await failed;

    service.reset();

    expect(service.turns()).toEqual([]);
    expect(service.error()).toBeNull();
    expect(service.hasConversation()).toBe(false);
  });
});
