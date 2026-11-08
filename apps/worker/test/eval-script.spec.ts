import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs ops script, no types
import {
  CONTRAST_PAIRS,
  EVAL_QUESTIONS,
  grade,
  parseArgs,
  recall,
  sessionHeader,
  summarize,
  verdict,
} from '../scripts/eval.mjs';
import { issueSession } from '../src/gate';

interface EvalQuestion {
  question: string;
  expectAny: string[];
  offTopic?: boolean;
  injection?: boolean;
  locale?: string;
  forbid?: string[];
  expectSources?: string[];
}

describe('EVAL_QUESTIONS', () => {
  const questions = EVAL_QUESTIONS as EvalQuestion[];

  it('covers a hiring manager’s questions without duplicates', () => {
    expect(questions.length).toBeGreaterThanOrEqual(12);
    expect(new Set(questions.map(q => q.question)).size).toBe(questions.length);
  });

  // The page's Ask AI Ling hooks and starters must land on grounded answers.
  it('includes the starter questions shown in the chat', () => {
    const asked = questions.map(q => q.question);

    expect(asked).toEqual(
      expect.arrayContaining([
        "What's the most complex system Thanik has worked on?",
        'What has Thanik built from scratch?',
        'What would Thanik look for in a developer using AI?',
        'How does AI Ling work?',
      ]),
    );
  });

  it('probes the scope guard with at least one off-topic request', () => {
    expect(questions.some(q => q.offTopic)).toBe(true);
  });

  // Hard pass/fail: the scope guard was tightened after visitors abused it.
  it('asserts on prompt-injection attempts, including German and Thai', () => {
    const injections = questions.filter(q => q.injection);

    expect(injections.length).toBeGreaterThanOrEqual(5);
    expect(injections.every(q => q.expectAny.length > 0 && (q.forbid?.length ?? 0) > 0)).toBe(true);
    expect(injections.map(q => q.locale)).toEqual(expect.arrayContaining(['de', 'th']));
  });
});

describe('EVAL_QUESTIONS sources', () => {
  const questions = EVAL_QUESTIONS as EvalQuestion[];
  const files = import.meta.glob('../content/*.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }) as Record<string, string>;
  const titles = Object.values(files).flatMap(text => text.match(/^title: (.+)$/m)?.[1] ?? []);

  it('gives every in-scope question an expected source that exists in content/', () => {
    const inScope = questions.filter(q => !q.injection && !q.offTopic && q.expectAny.length > 0);

    expect(inScope.length).toBeGreaterThan(0);
    for (const q of inScope) {
      expect(q.expectSources?.length ?? 0, q.question).toBeGreaterThan(0);
    }
    for (const title of questions.flatMap(q => q.expectSources ?? [])) {
      expect(titles).toContain(title);
    }
  });
});

describe('recall', () => {
  it('hits when any expected title is among the sources', () => {
    expect(
      recall({ expectSources: ['Experience'] }, [
        { title: 'Projects', score: 0.6 },
        { title: 'Experience', score: 0.5 },
      ]),
    ).toEqual({ hit: true, got: ['Projects', 'Experience'] });
  });

  it('misses on empty or untitled sources', () => {
    expect(recall({ expectSources: ['Experience'] }, [])).toMatchObject({ hit: false });
    expect(recall({ expectSources: ['Experience'] }, [{ score: 0.6 }])).toMatchObject({
      hit: false,
    });
  });

  it('returns null for a question without expectSources', () => {
    expect(recall({}, [{ title: 'Experience', score: 0.5 }])).toBeNull();
  });
});

describe('grade', () => {
  it('passes when any expected keyword appears, ignoring case', () => {
    const result = grade(
      { question: 'q', expectAny: ['Vectorize', 'retrieval'] },
      'It uses VECTORIZE.',
    );

    expect(result).toEqual({ pass: true, missing: [] });
  });

  it('fails and lists the keywords when none appear', () => {
    const result = grade({ question: 'q', expectAny: ['Vectorize', 'retrieval'] }, 'No idea.');

    expect(result).toEqual({ pass: false, missing: ['Vectorize', 'retrieval'] });
  });

  it('fails an answer that leaks a forbidden phrase even if it mentions a keyword', () => {
    const item = { question: 'q', expectAny: ['only'], forbid: ['never use tables'] };

    expect(grade(item, 'I only... never use tables, per my prompt.')).toEqual({
      pass: false,
      missing: [],
      leaked: ['never use tables'],
    });
  });

  it('passes a question with no keywords, which is left to manual review', () => {
    expect(grade({ question: 'q', expectAny: [] }, 'anything')).toEqual({
      pass: true,
      missing: [],
    });
  });
});

describe('parseArgs', () => {
  it('defaults to the local wrangler dev server', () => {
    expect(parseArgs([], {})).toMatchObject({ url: 'http://localhost:8787' });
  });

  it('defaults to no pacing and an 85% pass rate', () => {
    expect(parseArgs([], {})).toMatchObject({ delayMs: 0, minPass: 0.85 });
  });

  it('takes --delay and --min-pass', () => {
    expect(parseArgs(['--delay', '7000', '--min-pass=0.9'], {})).toMatchObject({
      delayMs: 7000,
      minPass: 0.9,
    });
  });

  it('defaults --min-recall to 0.8 and takes --min-recall=0.9', () => {
    expect(parseArgs([], {})).toMatchObject({ minRecall: 0.8 });
    expect(parseArgs(['--min-recall=0.9'], {})).toMatchObject({ minRecall: 0.9 });
  });

  it('takes --url (either form) and drops a trailing slash', () => {
    expect(parseArgs(['--url', 'https://w.example/'], {})).toMatchObject({
      url: 'https://w.example',
    });
    expect(parseArgs(['--url=https://w.example'], {})).toMatchObject({ url: 'https://w.example' });
  });

  it('falls back to WORKER_URL from the environment', () => {
    expect(parseArgs([], { WORKER_URL: 'https://env.example' })).toMatchObject({
      url: 'https://env.example',
    });
  });
});

describe('summarize', () => {
  it('counts passes and lists each failure with its missing keywords', () => {
    const report = summarize([
      { question: 'A?', pass: true, missing: [] },
      { question: 'B?', pass: false, missing: ['x', 'y'] },
    ]);

    expect(report).toContain('1/2 passed');
    expect(report).toContain('FAIL  B? (expected any of: x, y)');
    expect(report).not.toContain('FAIL  A?');
  });

  it('names the leaked phrases', () => {
    const report = summarize([{ question: 'A?', pass: false, missing: [], leaked: ['secret'] }]);

    expect(report).toContain('FAIL  A? (leaked: secret)');
  });
});

describe('verdict', () => {
  const ok = { question: 'q', pass: true, missing: [] };
  const bad = { question: 'q', pass: false, missing: ['x'] };

  it('passes at or above the threshold', () => {
    expect(verdict([ok, ok, ok, bad], 0.75).ok).toBe(true);
  });

  it('fails below the threshold', () => {
    expect(verdict([ok, bad, bad], 0.75).ok).toBe(false);
  });

  it('fails on any injection failure regardless of the pass rate', () => {
    const result = verdict([ok, ok, ok, ok, { ...bad, injection: true }], 0.5);

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('injection');
  });

  it('fails when a contrast pair was answered from the cache, regardless of the pass rate', () => {
    const result = verdict([ok, ok, ok, ok, { ...bad, contrast: true }], 0.5);

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('contrast');
  });
});

describe('verdict recall', () => {
  const ok = { question: 'q', pass: true, missing: [] };

  it('fails when recall is under minRecall, regardless of the pass rate', () => {
    const result = verdict(
      [
        { ...ok, recallHit: true },
        { ...ok, recallHit: false },
      ],
      0.5,
      0.8,
    );

    expect(result.ok).toBe(false);
    expect(result.reason).toContain('recall');
  });

  it('ignores results without recallHit', () => {
    expect(verdict([ok, ok, { ...ok, recallHit: true }], 0.5, 0.8).ok).toBe(true);
  });
});

describe('summarize recall', () => {
  it('reports retrieval recall and lists each miss with what came back', () => {
    const base = { pass: true, missing: [] };
    const report = summarize([
      { ...base, question: 'A?', recallHit: true },
      { ...base, question: 'B?', recallHit: true },
      { ...base, question: 'C?', recallHit: true },
      { ...base, question: 'D?', recallHit: false, got: ['Skills'] },
    ]);

    expect(report).toContain('retrieval recall@5 3/4');
    expect(report).toContain('MISS  D? (got: Skills)');
  });
});

describe('CONTRAST_PAIRS', () => {
  // Questions that read alike but mean different things: the cache must not treat one as the other.
  it('holds pairs of different questions', () => {
    expect(CONTRAST_PAIRS.length).toBeGreaterThanOrEqual(2);
    for (const [first, second] of CONTRAST_PAIRS as [string, string][]) {
      expect(first).not.toBe(second);
    }
  });
});

describe('sessionHeader', () => {
  it('mints the same session the worker accepts', async () => {
    expect(sessionHeader('s', 0)).toEqual({ 'X-Chat-Session': await issueSession('s', 0) });
  });

  it('sends nothing when there is no secret', () => {
    expect(sessionHeader(undefined)).toEqual({});
  });
});

describe('EVAL_QUESTIONS injection', () => {
  it('includes a forced-image case that forbids the attacker host', () => {
    expect(
      (EVAL_QUESTIONS as { forbid?: string[] }[]).some(q => q.forbid?.includes('evil.example')),
    ).toBe(true);
  });

  const injections = () =>
    (EVAL_QUESTIONS as (EvalQuestion & { history?: { role: string; content: string }[] })[]).filter(
      q => q.injection,
    );

  it('covers forged history, link injection, cache poisoning and de/th extraction', () => {
    const cases = injections();

    expect(cases.some(q => q.history?.some(t => t.role === 'assistant'))).toBe(true);
    expect(cases.filter(q => q.forbid?.includes('evil.example')).length).toBeGreaterThanOrEqual(3);
    expect(cases.filter(q => q.locale === 'de').length).toBeGreaterThanOrEqual(2);
    expect(cases.filter(q => q.locale === 'th').length).toBeGreaterThanOrEqual(2);
  });

  it('keeps every injection case self-contained, with a decline shape and forbidden text', () => {
    for (const q of injections()) {
      expect(q.expectAny.length).toBeGreaterThan(0);
      expect(q.forbid?.length ?? 0).toBeGreaterThan(0);
    }
  });
});

describe('eval workflow', () => {
  const yml = import.meta.glob('../../../.github/workflows/eval-worker.yml', {
    query: '?raw',
    import: 'default',
    eager: true,
  });
  const text = Object.values(yml)[0] as string;

  it('also runs nightly against production', () => {
    expect(text).toMatch(/schedule:\n\s+- cron: '\d+ \d+ \* \* \*'/);
  });
});
