import { describe, expect, it } from 'vitest';
import wrangler from '../wrangler.jsonc?raw';

const modelOf = (name: string) => new RegExp(`"${name}":\\s*"([^"]+)"`).exec(wrangler)?.[1];

describe('provider models', () => {
  it('GROQ_MODEL is pinned, not a floating alias', () => {
    const model = modelOf('GROQ_MODEL');
    expect(model).toBeTruthy();
    expect(model).not.toMatch(/latest/);
  });

  // Google retires pinned Gemini versions for new keys without notice (404), which silently
  // removed the fallback; a moving alias is the lesser risk.
  it('GOOGLE_MODEL follows a -latest alias', () => {
    expect(modelOf('GOOGLE_MODEL')).toMatch(/-latest$/);
  });
});
