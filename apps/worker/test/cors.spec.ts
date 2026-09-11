import { describe, expect, it } from 'vitest';
import { resolveOrigin } from '../src/cors';

describe('resolveOrigin', () => {
  const allowedOrigin = 'https://thanikc.dev';

  it('echoes the configured site origin back', () => {
    expect(resolveOrigin(allowedOrigin, allowedOrigin)).toBe(allowedOrigin);
  });

  it('echoes the local Angular dev server origin back', () => {
    expect(resolveOrigin('http://localhost:4200', allowedOrigin)).toBe('http://localhost:4200');
  });

  it('falls back to the configured origin for an unrecognised request origin', () => {
    expect(resolveOrigin('https://evil.example', allowedOrigin)).toBe(allowedOrigin);
  });

  it('falls back to the configured origin when no request origin is present', () => {
    expect(resolveOrigin(undefined, allowedOrigin)).toBe(allowedOrigin);
  });
});
