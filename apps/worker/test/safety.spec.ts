import { describe, expect, it } from 'vitest';
import { isCacheSafe } from '../src/safety';

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
