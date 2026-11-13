import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import {
  buildMessages,
  busyAnswer,
  declineAnswer,
  disabledAnswer,
  embed,
  MIN_SCORE,
  search,
  smallTalkAnswer,
} from './rag';
import { generate, ChatError, type ChatMessage } from './chat/client';
import { ingest } from './ingest';
import { record, type ChatPoint } from './telemetry';
import { takeGeneration } from './budget';
import {
  dropForgedTurns,
  type SignedTurn,
  issueSession,
  signAnswer,
  verifySession,
  verifyTurnstile,
} from './gate';
import { CACHE_MARGIN, isCacheSafe, moderate } from './safety';
import { redactPii } from './pii';
import { cacheKey, cacheLocale, lookupExact, lookupSemantic, purgeCache, store } from './cache';

const app = new Hono<{ Bindings: Env }>();

// Set after the handler ran, so errors and 404s carry them too.
app.use('*', async (c, next) => {
  await next();
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('Cache-Control', 'no-store');
  c.res.headers.set('Referrer-Policy', 'no-referrer');
});

app.use('/api/*', (c, next) =>
  cors({
    origin: c.env.ALLOWED_ORIGIN.split(','),
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Turnstile-Token', 'X-Chat-Session'],
    exposeHeaders: ['X-Request-Id', 'X-Chat-Session'],
    maxAge: 86400,
  })(c, next),
);

const tooLarge = (maxSize: number) =>
  bodyLimit({ maxSize, onError: c => c.json({ error: 'payload too large' }, 413) });
app.use('/api/chat', tooLarge(32 * 1024));
app.use('/api/ingest', tooLarge(1024 * 1024));

app.get('/api/health', c => c.json({ status: 'ok' }));

const MAX_MESSAGE_CHARS = 2000;

/** Mirrors the widget's CHAT_HISTORY_LIMIT; anything longer is not our UI talking. */
const MAX_HISTORY_TURNS = 6;
/** The languages the site is published in. */
const LOCALES: readonly unknown[] = ['en', 'de', 'th'];

app.post('/api/chat', async c => {
  const started = Date.now();
  const requestId = crypto.randomUUID();
  c.header('X-Request-Id', requestId);

  // Only the locale is read this early, so the kill switch can answer in the visitor's language.
  const requestLocale = ((await c.req.json().catch(() => null)) as { locale?: unknown } | null)
    ?.locale;
  const track = (p: Pick<ChatPoint, 'provider' | 'cache' | 'outcome'> & Partial<ChatPoint>) =>
    record(c.env, {
      requestId,
      locale: cacheLocale(requestLocale),
      latencyMs: Date.now() - started,
      topScore: -1,
      failovers: 0,
      answerLength: 0,
      cacheEligible: false,
      ...p,
    });

  if (c.env.CHAT_DISABLED === 'true') {
    const answer = disabledAnswer(requestLocale);
    track({ provider: 'none', cache: 'none', outcome: 'disabled', answerLength: answer.length });
    return c.json({ error: 'disabled', answer }, 503);
  }

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
      track({ provider: 'none', cache: 'none', outcome: 'forbidden' });
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

  if (body?.locale !== undefined && !LOCALES.includes(body.locale)) {
    return c.json({ error: 'unsupported locale' }, 400);
  }
  if (Array.isArray(body?.history) && body.history.length > MAX_HISTORY_TURNS) {
    return c.json({ error: 'history is too long' }, 400);
  }

  // Visitor input: a `system` turn here would otherwise reach the model as an instruction.
  // Long turns are cut rather than dropped, since a real answer can exceed the message limit.
  const turns: SignedTurn[] = Array.isArray(body?.history)
    ? (body.history as unknown[]).filter(
        (m): m is SignedTurn =>
          typeof m === 'object' &&
          m !== null &&
          ((m as SignedTurn).role === 'user' || (m as SignedTurn).role === 'assistant') &&
          typeof (m as SignedTurn).content === 'string',
      )
    : [];
  // The signature covers the answer as we sent it, so check before cutting or redacting.
  const rawHistory: ChatMessage[] = (
    SESSION_SECRET ? await dropForgedTurns(turns, SESSION_SECRET) : turns
  ).map(({ role, content }) => ({ role, content: content.slice(0, MAX_MESSAGE_CHARS) }));

  // Personal data stays out of providers, embeddings, moderation and the shared cache.
  const { text: message, found: hasPii } = redactPii(rawMessage);
  const history = rawHistory.map(m => ({ ...m, content: redactPii(m.content).text }));

  const locale = typeof body?.locale === 'string' ? body.locale : undefined;

  // A follow-up's answer depends on the turns before it, so only a conversation's
  // opening message goes through the cache.
  const cacheable = history.length === 0 && !hasPii;
  // A follow-up ("tell me more") embeds poorly alone, so it is searched with the questions before it.
  const query = [...history.filter(m => m.role === 'user').map(m => m.content), message].join('\n');
  // Every answer goes back signed, so the client can prove its assistant turns on follow-ups.
  const reply = async <T extends { answer: string }>(payload: T) =>
    c.json(
      SESSION_SECRET
        ? { ...payload, answerSig: await signAnswer(SESSION_SECRET, payload.answer) }
        : payload,
    );
  const smallTalk = smallTalkAnswer(message, locale);
  if (smallTalk) {
    track({ provider: 'none', cache: 'none', outcome: 'ok', answerLength: smallTalk.length });
    return reply({ answer: smallTalk, provider: 'none', sources: [] });
  }

  const lang = cacheLocale(locale);
  const key = await cacheKey(message, lang);
  if (cacheable) {
    const hit = await lookupExact(c.env, key);
    if (hit) {
      track({
        provider: hit.provider,
        cache: 'exact',
        outcome: 'ok',
        answerLength: hit.answer.length,
      });
      return reply({ ...hit, cached: 'exact' });
    }
  }

  let topScore = -1;
  try {
    // One embedding serves both the semantic lookup and retrieval.
    const vector = await embed(query, c.env);
    if (cacheable) {
      const hit = await lookupSemantic(c.env, vector, lang);
      if (hit) {
        track({
          provider: hit.provider,
          cache: 'semantic',
          outcome: 'ok',
          answerLength: hit.answer.length,
        });
        return reply({ ...hit, cached: 'semantic' });
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
      return reply({ answer, provider: 'none', sources: [] });
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
      return reply({ answer, provider: 'none', sources: [] });
    }

    const { answer, provider, failovers, truncated } = await generate(
      buildMessages(message, chunks, history, locale),
      c.env,
    );
    // Only what cleared the bar: a weak match was retrieved but is not where the answer came from.
    const sources = chunks
      .filter(chunk => chunk.score >= MIN_SCORE)
      .map(({ title, score }) => ({ title, score }));
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
      return reply({ answer: declined, provider: 'none', sources: [] });
    }
    if (verdict === 'error') console.warn('moderation failed; answer not cached');
    const stored = wouldCache && verdict === 'safe';
    if (stored) {
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
      cacheEligible: stored,
    });
    return reply({ answer, provider, sources });
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

const DOC_ID = /^[a-z0-9-]{1,64}$/;

app.post('/api/ingest', async c => {
  const requestId = crypto.randomUUID();
  c.header('X-Request-Id', requestId);
  // CI mints a short-lived token from INGEST_TOKEN, so a captured request can't be replayed later.
  const secret = c.env.INGEST_TOKEN;
  const bearer = c.req.header('Authorization')?.match(/^Bearer (\S+)$/)?.[1];
  if (!secret || !bearer || !(await verifySession(bearer, secret))) {
    return c.json({ error: 'unauthorized' }, 401);
  }

  const body = (await c.req.json().catch(() => null)) as {
    id?: unknown;
    text?: unknown;
    metadata?: unknown;
  } | null;

  if (typeof body?.id !== 'string' || !DOC_ID.test(body.id)) {
    return c.json({ error: 'id must match [a-z0-9-]{1,64}' }, 400);
  }
  if (typeof body?.text !== 'string' || body.text.trim() === '') {
    return c.json({ error: 'non-empty text is required' }, 400);
  }

  const metadata =
    typeof body.metadata === 'object' && body.metadata !== null
      ? (body.metadata as Record<string, unknown>)
      : {};

  const { chunks, skipped, hash } = await ingest(body.id, body.text, metadata, c.env);
  console.log(JSON.stringify({ event: 'ingest', id: body.id, chunks, skipped, hash, requestId }));
  // Answers cached against the old content are stale as soon as the index changes.
  // ponytail: Vectorize upserts land in 1–3 min, so an answer cached in that window can
  // still be grounded on old content; re-run the ingest if that ever matters.
  if (chunks > 0) await purgeCache(c.env);
  return c.json({ ok: true, chunks, ...(skipped && { skipped }) });
});

app.notFound(c => c.json({ error: 'not found' }, 404));

export default app;
