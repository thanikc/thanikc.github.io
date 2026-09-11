/**
 * Static copy for the profile page. The page states the narrative only; the depth
 * behind each claim lives in AI Ling's knowledge base (`apps/worker/content`), and
 * every hook question here must be answerable from it. No company names on the page.
 */

/** A kind of problem Thanik works on, with the stack it involves and a hook into AI Ling. */
export interface WorkTheme {
  title: string;
  summary: string;
  chips: readonly string[];
  /** Visible label of the Ask AI Ling hook. */
  hookLabel: string;
  /** The question the hook asks AI Ling. */
  question: string;
}

export const WORK_THEMES: readonly WorkTheme[] = [
  {
    title: 'Large Angular front ends for banking',
    summary: 'Portals and micro-frontends that many teams, and many banks, build on.',
    chips: ['Angular', 'TypeScript', 'RxJS', 'Web Components', 'Micro-frontends'],
    hookLabel: 'Ask what “large” means here',
    question: 'What is the most complex front end Thanik has worked on?',
  },
  {
    title: 'Modernising systems that are already live',
    summary: "Performance and architecture work on code that can't stop shipping.",
    chips: ['SSR', 'Zoneless', 'Signals', 'Performance'],
    hookLabel: 'Ask what changed',
    question: 'What did Thanik modernise on the banking portal, and why?',
  },
  {
    title: 'The services and delivery behind them',
    summary: 'Spring Boot services on OpenShift, and the pipelines that ship them.',
    chips: ['Java', 'Spring Boot', 'REST', 'OpenShift', 'Jenkins'],
    hookLabel: 'Ask about the back end',
    question: 'What back-end systems has Thanik built?',
  },
  {
    title: "AI in a team's workflow",
    summary: "Making AI-generated code meet the team's standard, not just mine.",
    chips: ['AI coding rules', 'TDD', 'Code review'],
    hookLabel: 'Ask how he uses AI',
    question: 'How does Thanik use AI in a team?',
  },
];
