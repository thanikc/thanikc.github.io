import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

describe('GET /api/health', () => {
  it('returns { status: "ok" }', async () => {
    const res = await SELF.fetch('https://worker.test/api/health');

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: 'ok' });
  });

  it('404s unknown routes as JSON', async () => {
    const res = await SELF.fetch('https://worker.test/nope');

    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: 'not found' });
  });
});
