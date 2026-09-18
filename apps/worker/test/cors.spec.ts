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

  it('echoes the local Angular dev server back', async () => {
    expect(await originFor('http://localhost:4200')).toBe('http://localhost:4200');
  });

  it('sends no allow-origin header to any other origin, so the browser blocks it', async () => {
    expect(await originFor('https://evil.example')).toBeNull();
  });

  it('sends no allow-origin header when the request has no origin', async () => {
    expect(await originFor()).toBeNull();
  });
});
