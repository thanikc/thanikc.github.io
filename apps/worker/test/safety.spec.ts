import { describe, expect, it, vi } from 'vitest';
import { isCacheSafe, moderate, MODERATION_MODEL } from '../src/safety';

describe('isCacheSafe', () => {
  it('accepts plain Markdown', () =>
    expect(isCacheSafe('**Thanik** builds portals.\n- one')).toBe(true));
  it('accepts mailto and site-relative links', () => {
    expect(isCacheSafe('[mail](mailto:a@b.c)')).toBe(true);
    expect(isCacheSafe('[cv](/en/#experience)')).toBe(true);
  });
  it('rejects a Markdown image', () => expect(isCacheSafe('![x](/img/a.png)')).toBe(false));
  it('rejects an absolute link', () =>
    expect(isCacheSafe('[x](https://evil.example)')).toBe(false));
  it('rejects a bare URL', () => expect(isCacheSafe('see https://evil.example now')).toBe(false));
  it('rejects a bare www host', () => expect(isCacheSafe('go to www.evil.example')).toBe(false));
  it('rejects an HTML tag', () => expect(isCacheSafe('<img src=x>')).toBe(false));
});

describe('moderate', () => {
  const envWith = (run: unknown) => ({ AI: { run } }) as unknown as Env;

  it('asks the moderation model about the question and answer', async () => {
    const run = vi.fn().mockResolvedValue({ response: { safe: true } });
    await moderate('q', 'a', envWith(run));
    expect(run).toHaveBeenCalledWith(MODERATION_MODEL, {
      messages: [
        { role: 'user', content: 'q' },
        { role: 'assistant', content: 'a' },
      ],
    });
  });

  it('returns safe', async () =>
    expect(
      await moderate('q', 'a', envWith(vi.fn().mockResolvedValue({ response: { safe: true } }))),
    ).toBe('safe'));

  it('returns unsafe', async () =>
    expect(
      await moderate(
        'q',
        'a',
        envWith(vi.fn().mockResolvedValue({ response: { safe: false, categories: ['S1'] } })),
      ),
    ).toBe('unsafe'));

  it('returns error when the call rejects', async () =>
    expect(await moderate('q', 'a', envWith(vi.fn().mockRejectedValue(new Error('x'))))).toBe(
      'error',
    ));

  it('returns error for an unrecognised shape', async () =>
    expect(await moderate('q', 'a', envWith(vi.fn().mockResolvedValue({ data: [1] })))).toBe(
      'error',
    ));
});
