import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { resolveOrigin } from './cors';
import { buildMessages, retrieve } from './rag';
import { generate, ChatError, type ChatMessage } from './chat/client';
import { ingest } from './ingest';

const app = new Hono<{ Bindings: Env }>();

app.use('/api/*', (c, next) =>
  cors({
    origin: origin => resolveOrigin(origin || undefined, c.env.ALLOWED_ORIGIN),
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })(c, next),
);

app.get('/api/health', c => c.json({ status: 'ok' }));

app.post('/api/chat', async c => {
  const body = (await c.req.json().catch(() => null)) as {
    message?: unknown;
    history?: unknown;
  } | null;

  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  if (message === '') {
    return c.json({ error: 'message is required' }, 400);
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

  const chunks = await retrieve(message, c.env);

  try {
    const { answer, provider } = await generate(buildMessages(message, chunks, history), c.env);
    return c.json({ answer, provider, sources: chunks });
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
