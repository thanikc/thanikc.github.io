import { describe, expect, it } from 'vitest';
import app from '../src/index';

describe('CORS', () => {
  const env = { ALLOWED_ORIGIN: 'https://thanikc.dev' } as unknown as Env;
  const originFor = async (origin?: string) => {
    const res = await app.request(
      '/api/health',
      origin ? { headers: { Origin: origin } } : {},
      env,
    );
    return res.headers.get('Access-Control-Allow-Origin');
  };

  it('echoes the configured site origin back', async () => {
    expect(await originFor('https://thanikc.dev')).toBe('https://thanikc.dev');
  });

  it('echoes every origin of a comma-separated list, for local dev', async () => {
    const dev = { ALLOWED_ORIGIN: 'https://thanikc.dev,http://localhost:4200' } as unknown as Env;
    const res = await app.request(
      '/api/health',
      { headers: { Origin: 'http://localhost:4200' } },
      dev,
    );

    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:4200');
  });

  it('does not allow the local dev server unless it is configured', async () => {
    expect(await originFor('http://localhost:4200')).toBeNull();
  });

  it('sends no allow-origin header to any other origin, so the browser blocks it', async () => {
    expect(await originFor('https://evil.example')).toBeNull();
  });

  it('sends no allow-origin header when the request has no origin', async () => {
    expect(await originFor()).toBeNull();
  });
});
