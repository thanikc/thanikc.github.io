import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { buildMessages, declineAnswer, embed, MIN_SCORE, search } from './rag';
import { generate, ChatError, type ChatMessage } from './chat/client';
import { ingest } from './ingest';
import { cacheKey, cacheLocale, lookupExact, lookupSemantic, store } from './cache';

const app = new Hono<{ Bindings: Env }>();

app.use('/api/*', (c, next) =>
  cors({
    origin: [c.env.ALLOWED_ORIGIN, 'http://localhost:4200'],
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })(c, next),
);

app.get('/api/health', c => c.json({ status: 'ok' }));

const MAX_MESSAGE_CHARS = 2000;

app.post('/api/chat', async c => {
  // Absent binding (local dev, tests) means no limit.
  const verdict = await c.env.CHAT_LIMIT?.limit({
    key: c.req.header('cf-connecting-ip') ?? 'anon',
  });
  if (verdict && !verdict.success) {
    return c.json({ error: 'rate limited' }, 429);
  }

  const body = (await c.req.json().catch(() => null)) as {
    message?: unknown;
    history?: unknown;
    locale?: unknown;
  } | null;

  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (message === '') {
    return c.json({ error: 'message is required' }, 400);
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return c.json({ error: `message must be at most ${MAX_MESSAGE_CHARS} characters` }, 400);
  }

  const history: ChatMessage[] = Array.isArray(body?.history)
    ? (body.history as unknown[]).filter(
        (m): m is ChatMessage =>
          typeof m === 'object' &&
          m !== null &&
          'role' in m &&
          'content' in m &&
          typeof (m as ChatMessage).content === 'string',
      )
    : [];

  // `locale` is visitor input; buildMessages and declineAnswer only honour a language
  // the site is actually published in and ignore anything else.
  const locale = typeof body?.locale === 'string' ? body.locale : undefined;

  // A follow-up's answer depends on the turns before it, so only a conversation's
  // opening message goes through the cache.
  const cacheable = history.length === 0;
  const lang = cacheLocale(locale);
  const key = await cacheKey(message, lang);
  if (cacheable) {
    const hit = await lookupExact(c.env, key);
    if (hit) return c.json({ ...hit, cached: 'exact' });
  }

  // One embedding serves both the semantic lookup and retrieval.
  const vector = await embed(message, c.env);
  if (cacheable) {
    const hit = await lookupSemantic(c.env, vector, lang);
    if (hit) return c.json({ ...hit, cached: 'semantic' });
  }

  const chunks = await search(vector, c.env);

  // A follow-up ("tell me more") embeds poorly on its own but is grounded by the
  // conversation, so the gate only applies to a conversation's opening message.
  if (history.length === 0 && (chunks[0]?.score ?? 0) < MIN_SCORE) {
    return c.json({ answer: declineAnswer(locale), provider: 'none', sources: [] });
  }

  try {
    const { answer, provider } = await generate(
      buildMessages(message, chunks, history, locale),
      c.env,
    );
    const sources = chunks.map(({ title, score }) => ({ title, score }));
    if (cacheable) {
      c.executionCtx.waitUntil(
        store(c.env, {
          key,
          locale: lang,
          question: message,
          answer,
          provider,
          sources,
          vector,
        }),
      );
    }
    return c.json({ answer, provider, sources });
  } catch (err) {
    if (err instanceof ChatError) {
      return c.json({ error: err.message, attempts: err.attempts }, 502);
    }
    throw err;
  }
});

app.post('/api/ingest', async c => {
  const token = c.env.INGEST_TOKEN;
  if (!token || c.req.header('Authorization') !== `Bearer ${token}`) {
    return c.json({ error: 'unauthorized' }, 401);
  }

  const body = (await c.req.json().catch(() => null)) as {
    id?: unknown;
    text?: unknown;
    metadata?: unknown;
  } | null;

  if (typeof body?.id !== 'string' || typeof body?.text !== 'string' || body.text.trim() === '') {
    return c.json({ error: 'id and non-empty text are required' }, 400);
  }

  const metadata =
    typeof body.metadata === 'object' && body.metadata !== null
      ? (body.metadata as Record<string, unknown>)
      : {};

  const chunks = await ingest(body.id, body.text, metadata, c.env);
  return c.json({ ok: true, chunks });
});

app.notFound(c => c.json({ error: 'not found' }, 404));

export default app;
