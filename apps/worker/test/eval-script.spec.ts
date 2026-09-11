import { describe, expect, it } from 'vitest';
// @ts-expect-error — plain .mjs ops script, no types
import { EVAL_QUESTIONS, grade, parseArgs, summarize } from '../scripts/eval.mjs';

interface EvalQuestion {
  question: string;
  expectAny: string[];
  offTopic?: boolean;
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
        'How does Thanik use AI in a team?',
        'How does AI Ling work?',
      ]),
    );
  });

  it('probes the scope guard with at least one off-topic request', () => {
    expect(questions.some(q => q.offTopic)).toBe(true);
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

  it('passes a question with no keywords, which is left to manual review', () => {
    expect(grade({ question: 'q', expectAny: [] }, 'anything')).toEqual({
      pass: true,
      missing: [],
    });
  });
});

describe('parseArgs', () => {
  it('defaults to the local wrangler dev server', () => {
    expect(parseArgs([], {})).toEqual({ url: 'http://localhost:8787' });
  });

  it('takes --url (either form) and drops a trailing slash', () => {
    expect(parseArgs(['--url', 'https://w.example/'], {})).toEqual({ url: 'https://w.example' });
    expect(parseArgs(['--url=https://w.example'], {})).toEqual({ url: 'https://w.example' });
  });

  it('falls back to WORKER_URL from the environment', () => {
    expect(parseArgs([], { WORKER_URL: 'https://env.example' })).toEqual({
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
});
