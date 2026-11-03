import { describe, expect, it } from 'vitest';
import wrangler from '../wrangler.jsonc?raw';

const modelOf = (name: string) => new RegExp(`"${name}":\\s*"([^"]+)"`).exec(wrangler)?.[1];

describe('provider models', () => {
  it.each(['GROQ_MODEL', 'GOOGLE_MODEL'])('%s is pinned, not a floating alias', name => {
    const model = modelOf(name);
    expect(model).toBeTruthy();
    expect(model).not.toMatch(/latest/);
  });
});
