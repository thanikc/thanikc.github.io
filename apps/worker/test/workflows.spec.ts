import { describe, expect, it } from 'vitest';

// The Workers test pool has no repo filesystem, so workflows are bundled as raw text.
const workflows = import.meta.glob('../../../.github/workflows/*.yml', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;
const read = (name: string) => workflows[`../../../.github/workflows/${name}`]!;

describe('ai-ling-alerts workflow', () => {
  const yml = read('ai-ling-alerts.yml');

  it('runs hourly and by hand', () => {
    expect(yml).toMatch(/cron: '\d+ \* \* \* \*'/);
    expect(yml).toContain('workflow_dispatch');
  });

  it('may write issues and nothing else', () => {
    const block = yml.match(/^permissions:\n((?: {2}.+\n)+)/m)![1]!;
    expect(
      block
        .trim()
        .split('\n')
        .map(l => l.trim()),
    ).toEqual(['contents: read', 'issues: write']);
  });
});

describe('every workflow', () => {
  it.each(Object.keys(workflows).map(p => p.split('/').pop()!))(
    '%s pins each action to a commit SHA',
    name => {
      const uses = [...read(name).matchAll(/^\s*(?:- )?uses: (\S+)/gm)].map(m => m[1]!);
      for (const u of uses) expect(u).toMatch(/^[\w.-]+\/[\w./-]+@[0-9a-f]{40}$/);
    },
  );
});
