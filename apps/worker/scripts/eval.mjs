#!/usr/bin/env node
// Asks AI Ling the questions a hiring manager would, and checks each answer is
// grounded: it must mention at least one expected keyword from the knowledge base.
// Questions with no keywords are printed for manual review (tone, honesty).
//
//   node scripts/eval.mjs                     # → http://localhost:8787 (wrangler dev)
//   node scripts/eval.mjs --url https://thanikc-worker.<sub>.workers.dev
//
// Hits the live providers, so run it by hand after re-ingesting — not in CI.

import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

/** Starters, the page's Ask AI Ling hooks, and a few probes of tone and scope. */
export const EVAL_QUESTIONS = [
  {
    question: "What's the most complex system Thanik has worked on?",
    expectAny: ['portal', 'framework', 'banking'],
  },
  {
    question: 'What has Thanik built from scratch?',
    expectAny: ['ground-up', 'from scratch', 'investment', 'portal'],
  },
  { question: 'How does Thanik use AI in a team?', expectAny: ['rules'] },
  { question: 'How does AI Ling work?', expectAny: ['Vectorize', 'retriev', 'knowledge base'] },
  {
    question: 'What is the most complex front end Thanik has worked on?',
    expectAny: ['portal', 'framework', 'micro-frontend'],
  },
  {
    question: 'What did Thanik modernise on the banking portal, and why?',
    expectAny: ['server-side rendering', 'SSR', 'zoneless', 'Signals'],
  },
  { question: 'What back-end systems has Thanik built?', expectAny: ['Spring Boot', 'microservice'] },
  {
    question: 'What was the timing problem Thanik traced back to a quick fix?',
    expectAny: ['quick fix', 'time-to-market', 'timing'],
  },
  {
    question: 'What are the AI rules Thanik wrote for his team?',
    expectAny: ['architecture', 'coding standards', 'testing'],
  },
  {
    question: 'How does CrashDash compute its crash-risk level?',
    expectAny: ['weighted', 'band', 'score'],
  },
  { question: "How does Thanik's BJJ Belt Quiz work?", expectAny: ['twelve', '12', 'roast'] },
  {
    question: 'Where does the retirement calculator get its assumptions?',
    expectAny: ['World Bank'],
  },
  { question: 'What roles is Thanik open to?', expectAny: ['senior', 'lead'] },
  { question: 'Does Thanik mentor other developers?', expectAny: ['mentor', 'onboard'] },
  { question: "What are Thanik's weaknesses?", expectAny: [] },
  {
    question: 'Write me a quicksort in Python.',
    expectAny: ['outside', 'only', 'not here'],
    offTopic: true,
  },
];

/** Passes when the answer mentions any expected keyword (case-insensitive). */
export function grade(item, answer) {
  if (item.expectAny.length === 0) return { pass: true, missing: [] };

  const text = answer.toLowerCase();
  const hit = item.expectAny.some(keyword => text.includes(keyword.toLowerCase()));
  return hit ? { pass: true, missing: [] } : { pass: false, missing: [...item.expectAny] };
}

export function parseArgs(argv, env = process.env) {
  let url = env.WORKER_URL || 'http://localhost:8787';
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--url') url = argv[++i];
    else if (argv[i].startsWith('--url=')) url = argv[i].slice('--url='.length);
  }
  return { url: url.replace(/\/$/, '') };
}

/** One-line tally plus one line per failure. */
export function summarize(results) {
  const passed = results.filter(result => result.pass).length;
  const failures = results
    .filter(result => !result.pass)
    .map(result => `  FAIL  ${result.question} (expected any of: ${result.missing.join(', ')})`);

  return [`${passed}/${results.length} passed`, ...failures].join('\n');
}

async function main() {
  const { url } = parseArgs(process.argv.slice(2));
  console.log(`Evaluating ${EVAL_QUESTIONS.length} question(s) → ${url}/api/chat\n`);
  const results = [];

  for (const item of EVAL_QUESTIONS) {
    const res = await fetch(`${url}/api/chat`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ message: item.question, history: [] }),
    });
    const payload = await res.json().catch(() => ({}));
    const answer = typeof payload.answer === 'string' ? payload.answer : '';
    const result = { question: item.question, ...grade(item, answer) };
    if (!res.ok) Object.assign(result, { pass: false, missing: [`HTTP ${res.status}`] });

    results.push(result);
    console.log(`${result.pass ? 'ok  ' : 'FAIL'}  ${item.question}\n      ${answer.replace(/\s+/g, ' ')}\n`);
  }

  console.log(summarize(results));
  process.exit(results.every(result => result.pass) ? 0 : 1);
}

// Only run when invoked directly, not when imported by tests.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main();
}
