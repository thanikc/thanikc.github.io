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

export interface ProjectLink {
  label: string;
  url: string;
  /** External links open in a new tab; in-app routes navigate via the router. */
  external: boolean;
}

export interface ProjectStatus {
  label: string;
  /** Material icon ligature shown next to the label. */
  icon: string;
}

/** Something Thanik built on his own, presented as evidence rather than a hobby. */
export interface Project {
  name: string;
  icon: string;
  /** What it is for. */
  tagline: string;
  /** Why it exists; omitted rather than invented when there is no stated reason. */
  why?: string;
  /** One engineering decision worth asking about. */
  decision: string;
  stack: readonly string[];
  status: ProjectStatus;
  /** Featured projects get the first row. */
  featured: boolean;
  primary?: ProjectLink;
  source?: ProjectLink;
  hookLabel: string;
  question: string;
}

const REPO_URL = 'https://github.com/thanikc/thanikc.github.io';

export const PROJECTS: readonly Project[] = [
  {
    name: 'CrashDash',
    icon: 'trending_down',
    tagline: 'A dashboard that gauges the risk of a market crash from macro and market indicators.',
    why: 'Built for my own investing, and to build a complete Spring Boot and Angular system end to end, AI-assisted.',
    decision:
      'Missing data stays unscored instead of counting as zero, so a gap never reads as "no risk".',
    stack: ['Spring Boot', 'Angular', 'FRED API', 'OAuth sign-in'],
    status: { label: 'Private — sign-in required', icon: 'lock' },
    featured: true,
    primary: { label: 'Open CrashDash', url: 'https://crashdash.singdee.de/', external: true },
    hookLabel: 'Ask how the risk score works',
    question: 'How does CrashDash compute its crash-risk level?',
  },
  {
    name: 'AI Ling',
    icon: 'forum',
    tagline:
      'The assistant on this page: it answers questions about my career from a knowledge base I wrote.',
    why: 'So this page can stay short while the detail is one question away.',
    decision:
      "Answers aren't streamed, so a failing model provider can hand over to the next one without a garbled reply.",
    stack: ['Cloudflare Workers', 'Hono', 'Vectorize', 'RAG', 'Angular'],
    status: { label: 'Open source', icon: 'code' },
    featured: true,
    source: { label: 'Source', url: `${REPO_URL}/tree/main/apps/worker`, external: true },
    hookLabel: 'Ask how it works',
    question: 'How does AI Ling work?',
  },
  {
    name: 'BJJ Quiz',
    icon: 'sports_martial_arts',
    tagline:
      'Twelve questions guess the Brazilian Jiu-Jitsu belt you roll like, then AI roasts you, gently.',
    why: 'Just for fun, and to try an AI feature and Cloudflare Workers.',
    decision: 'Scoring happens on the server, and a canned roast steps in if the AI call fails.',
    stack: ['Angular', 'Cloudflare Workers', 'LLM'],
    status: { label: 'Live', icon: 'public' },
    featured: false,
    primary: {
      label: 'Take the quiz',
      url: 'https://bjj-quiz.thanikc.workers.dev/',
      external: true,
    },
    hookLabel: 'Ask how it works',
    question: "How does Thanik's BJJ Belt Quiz work?",
  },
  {
    name: 'Retirement Calculator',
    icon: 'calculate',
    tagline: 'Projects the nest egg and monthly savings needed for a target retirement income.',
    decision:
      'Default assumptions load live from the World Bank API and fall back to fixed values when it has no data.',
    stack: ['Angular Signals', 'World Bank API'],
    status: { label: 'Live', icon: 'public' },
    featured: false,
    primary: { label: 'Open calculator', url: '/calculator', external: false },
    hookLabel: 'Ask where the numbers come from',
    question: 'Where does the retirement calculator get its assumptions?',
  },
];
