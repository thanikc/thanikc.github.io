import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { buildMessages, busyAnswer, declineAnswer, embed, MIN_SCORE, search } from './rag';
import { generate, ChatError, type ChatMessage } from './chat/client';
import { ingest } from './ingest';
import { record, type ChatPoint } from './telemetry';
import { takeGeneration } from './budget';
import { issueSession, verifySession, verifyTurnstile } from './gate';
import { CACHE_MARGIN, isCacheSafe, moderate } from './safety';
import { redactPii } from './pii';
import { cacheKey, cacheLocale, lookupExact, lookupSemantic, purgeCache, store } from './cache';

const app = new Hono<{ Bindings: Env }>();

app.use('/api/*', (c, next) =>
  cors({
    origin: c.env.ALLOWED_ORIGIN.split(','),
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Turnstile-Token', 'X-Chat-Session'],
    exposeHeaders: ['X-Request-Id', 'X-Chat-Session'],
    maxAge: 86400,
  })(c, next),
);

app.get('/api/health', c => c.json({ status: 'ok' }));

const MAX_MESSAGE_CHARS = 2000;

/** Constant-time comparison; digests first so the two inputs always have the same length. */
async function sameSecret(a: string, b: string): Promise<boolean> {
  const [x, y] = await Promise.all(
    [a, b].map(s => crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))),
  );
  return crypto.subtle.timingSafeEqual(x!, y!);
}
/** Mirrors the widget's CHAT_HISTORY_LIMIT; anything longer is not our UI talking. */
const MAX_HISTORY_TURNS = 6;

app.post('/api/chat', async c => {
  const started = Date.now();
  const requestId = crypto.randomUUID();
  c.header('X-Request-Id', requestId);

  // A visitor proves they are human once (Turnstile) and then holds a short session, so the
  // challenge isn't re-run per message. Off unless both secrets are set (local dev, tests).
  const { TURNSTILE_SECRET, SESSION_SECRET } = c.env;
  if (TURNSTILE_SECRET && SESSION_SECRET) {
    const session = c.req.header('X-Chat-Session');
    const turnstile = c.req.header('X-Turnstile-Token');
    if (session && (await verifySession(session, SESSION_SECRET))) {
      // already verified
    } else if (
      turnstile &&
      (await verifyTurnstile(turnstile, c.req.header('cf-connecting-ip'), c.env))
    ) {
      c.header('X-Chat-Session', await issueSession(SESSION_SECRET));
    } else {
      return c.json({ error: 'verification required' }, 403);
    }
  }

  // Absent bindings (local dev, tests) mean no limit. The shared one is checked second so a
  // client already over its own limit doesn't spend it.
  const perClient = await c.env.CHAT_LIMIT?.limit({
    key: c.req.header('cf-connecting-ip') ?? 'anon',
  });
  const shared =
    perClient?.success === false ? undefined : await c.env.CHAT_LIMIT_GLOBAL?.limit({ key: 'all' });
  if (perClient?.success === false || shared?.success === false) {
    return c.json({ error: 'rate limited' }, 429);
  }

  const body = (await c.req.json().catch(() => null)) as {
    message?: unknown;
    history?: unknown;
    locale?: unknown;
  } | null;

  const rawMessage = typeof body?.message === 'string' ? body.message.trim() : '';
  if (rawMessage === '') {
    return c.json({ error: 'message is required' }, 400);
  }
  if (rawMessage.length > MAX_MESSAGE_CHARS) {
    return c.json({ error: `message must be at most ${MAX_MESSAGE_CHARS} characters` }, 400);
  }

  // Visitor input: a `system` turn here would otherwise reach the model as an instruction.
  // Long turns are cut rather than dropped, since a real answer can exceed the message limit.
  const rawHistory: ChatMessage[] = Array.isArray(body?.history)
    ? (body.history as unknown[])
        .filter(
          (m): m is ChatMessage =>
            typeof m === 'object' &&
            m !== null &&
            ((m as ChatMessage).role === 'user' || (m as ChatMessage).role === 'assistant') &&
            typeof (m as ChatMessage).content === 'string',
        )
        .slice(-MAX_HISTORY_TURNS)
        .map(({ role, content }) => ({ role, content: content.slice(0, MAX_MESSAGE_CHARS) }))
    : [];

  // Personal data stays out of providers, embeddings, moderation and the shared cache.
  const { text: message, found: hasPii } = redactPii(rawMessage);
  const history = rawHistory.map(m => ({ ...m, content: redactPii(m.content).text }));

  // `locale` is visitor input; buildMessages and declineAnswer only honour a language
  // the site is actually published in and ignore anything else.
  const locale = typeof body?.locale === 'string' ? body.locale : undefined;

  // A follow-up's answer depends on the turns before it, so only a conversation's
  // opening message goes through the cache.
  const cacheable = history.length === 0 && !hasPii;
  // A follow-up ("tell me more") embeds poorly alone, so it is searched with the turn before it.
  const lastUserTurn = history.filter(m => m.role === 'user').at(-1)?.content ?? '';
  const lang = cacheLocale(locale);
  const key = await cacheKey(message, lang);
  const track = (p: Pick<ChatPoint, 'provider' | 'cache' | 'outcome'> & Partial<ChatPoint>) =>
    record(c.env, {
      requestId,
      locale: lang,
      latencyMs: Date.now() - started,
      topScore: -1,
      failovers: 0,
      answerLength: 0,
      ...p,
    });
  if (cacheable) {
    const hit = await lookupExact(c.env, key);
    if (hit) {
      track({
        provider: hit.provider,
        cache: 'exact',
        outcome: 'ok',
        answerLength: hit.answer.length,
      });
      return c.json({ ...hit, cached: 'exact' });
    }
  }

  let topScore = -1;
  try {
    // One embedding serves both the semantic lookup and retrieval.
    const vector = await embed(cacheable ? message : [lastUserTurn, message].join('\n'), c.env);
    if (cacheable) {
      const hit = await lookupSemantic(c.env, vector, lang);
      if (hit) {
        track({
          provider: hit.provider,
          cache: 'semantic',
          outcome: 'ok',
          answerLength: hit.answer.length,
        });
        return c.json({ ...hit, cached: 'semantic' });
      }
    }

    const chunks = await search(vector, c.env);
    topScore = chunks[0]?.score ?? 0;

    if (topScore < MIN_SCORE) {
      const answer = declineAnswer(locale);
      track({
        provider: 'none',
        cache: 'none',
        outcome: 'refused',
        topScore,
        answerLength: answer.length,
      });
      return c.json({ answer, provider: 'none', sources: [] });
    }

    if (!(await takeGeneration(c.env))) {
      const answer = busyAnswer(locale);
      track({
        provider: 'none',
        cache: 'none',
        outcome: 'budget',
        topScore,
        answerLength: answer.length,
      });
      return c.json({ answer, provider: 'none', sources: [] });
    }

    const { answer, provider, failovers, truncated } = await generate(
      buildMessages(message, chunks, history, locale),
      c.env,
    );
    const sources = chunks.map(({ title, score }) => ({ title, score }));
    const safeToCache = isCacheSafe(answer);
    const wouldCache =
      cacheable && !truncated && topScore >= MIN_SCORE + CACHE_MARGIN && safeToCache;
    // Moderate what would be replayed to others, and anything carrying a link or image.
    const verdict = wouldCache || !safeToCache ? await moderate(message, answer, c.env) : 'safe';
    if (verdict === 'unsafe') {
      const declined = declineAnswer(locale);
      track({
        provider: 'none',
        cache: 'none',
        outcome: 'blocked',
        topScore,
        answerLength: declined.length,
      });
      return c.json({ answer: declined, provider: 'none', sources: [] });
    }
    if (verdict === 'error') console.warn('moderation failed; answer not cached');
    if (wouldCache && verdict === 'safe') {
      c.executionCtx.waitUntil(
        store(c.env, {
          key,
          locale: lang,
          answer,
          provider,
          sources,
          vector,
        }),
      );
    }
    track({
      provider,
      cache: 'none',
      outcome: 'ok',
      topScore,
      failovers,
      answerLength: answer.length,
    });
    return c.json({ answer, provider, sources });
  } catch (err) {
    // Provider errors can carry account details, so the reason goes to the logs only.
    const attempts = err instanceof ChatError ? err.attempts : [];
    console.error('chat failed', err instanceof ChatError ? attempts : err);
    track({
      provider: 'none',
      cache: 'none',
      outcome: 'failed',
      topScore,
      failovers: attempts.length,
    });
    return c.json({ error: 'could not generate an answer' }, 502);
  }
});

app.post('/api/ingest', async c => {
  const token = c.env.INGEST_TOKEN;
  if (!token || !(await sameSecret(c.req.header('Authorization') ?? '', `Bearer ${token}`))) {
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

  const { chunks, skipped } = await ingest(body.id, body.text, metadata, c.env);
  // Answers cached against the old content are stale as soon as the index changes.
  // ponytail: Vectorize upserts land in 1–3 min, so an answer cached in that window can
  // still be grounded on old content; re-run the ingest if that ever matters.
  if (chunks > 0) await purgeCache(c.env);
  return c.json({ ok: true, chunks, ...(skipped && { skipped }) });
});

app.notFound(c => c.json({ error: 'not found' }, 404));

export default app;
