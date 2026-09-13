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
    title: $localize`:Work theme title@@themes.platform.title:A shared platform, not one app`,
    summary: $localize`:Work theme summary@@themes.platform.summary:One of five on the Angular core of a homepage platform used across German cooperative banks — each bank configures and customises its own.`,
    chips: ['Angular', 'TypeScript', 'RxJS', 'Web Components', 'Micro-frontends'],
    hookLabel: $localize`:Ask AI Ling hook label@@themes.platform.hookLabel:Ask what makes it complex`,
    question: $localize`:Question sent to AI Ling@@themes.platform.question:What is the most complex front end Thanik has worked on?`,
  },
  {
    title: $localize`:Work theme title@@themes.modernising.title:Modernising systems that are already live`,
    summary: $localize`:Work theme summary@@themes.modernising.summary:Performance and architecture work on code that can't stop shipping.`,
    chips: ['SSR', 'Zoneless', 'Signals', 'Performance'],
    hookLabel: $localize`:Ask AI Ling hook label@@themes.modernising.hookLabel:Ask what changed`,
    question: $localize`:Question sent to AI Ling@@themes.modernising.question:What did Thanik modernise on the banking portal, and why?`,
  },
  {
    title: $localize`:Work theme title@@themes.services.title:The services and delivery behind them`,
    summary: $localize`:Work theme summary@@themes.services.summary:Spring Boot services on OpenShift, and the pipelines that ship them.`,
    chips: ['Java', 'Spring Boot', 'REST', 'OpenShift', 'Jenkins'],
    hookLabel: $localize`:Ask AI Ling hook label@@themes.services.hookLabel:Ask about the back end`,
    question: $localize`:Question sent to AI Ling@@themes.services.question:What back-end systems has Thanik built?`,
  },
  {
    title: $localize`:Work theme title@@themes.ai.title:AI in a team's workflow`,
    summary: $localize`:Work theme summary@@themes.ai.summary:Making AI-generated code meet the team's standard, not just mine.`,
    chips: ['AI coding rules', 'TDD', 'Code review'],
    hookLabel: $localize`:Ask AI Ling hook label@@themes.ai.hookLabel:Ask how he uses AI`,
    question: $localize`:Question sent to AI Ling@@themes.ai.question:How does Thanik use AI in a team?`,
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
  /** How it works, step by step; shown as a small flow diagram on the card. */
  flow?: readonly FlowStep[];
}

export interface FlowStep {
  label: string;
  detail: string;
}

const REPO_URL = 'https://github.com/thanikc/thanikc.github.io';

export const PROJECTS: readonly Project[] = [
  {
    name: 'CrashDash',
    icon: 'trending_down',
    tagline: $localize`:Project tagline@@projects.crashdash.tagline:A dashboard that gauges the risk of a market crash from macro and market indicators.`,
    why: $localize`:Why the project exists@@projects.crashdash.why:Built for my own investing, and to build a complete Spring Boot and Angular system end to end, AI-assisted.`,
    decision: $localize`:One engineering decision on the project@@projects.crashdash.decision:Missing data stays unscored instead of counting as zero, so a gap never reads as "no risk".`,
    stack: ['Spring Boot', 'Angular', 'FRED API', 'OAuth sign-in'],
    status: {
      label: $localize`:Project availability@@projects.crashdash.status:Private — sign-in required`,
      icon: 'lock',
    },
    featured: true,
    primary: {
      label: $localize`:Link that opens the project@@projects.crashdash.open:Open CrashDash`,
      url: 'https://crashdash.singdee.de/',
      external: true,
    },
    hookLabel: $localize`:Ask AI Ling hook label@@projects.crashdash.hookLabel:Ask how the risk score works`,
    question: $localize`:Question sent to AI Ling@@projects.crashdash.question:How does CrashDash compute its crash-risk level?`,
  },
  {
    name: 'AI Ling',
    icon: 'forum',
    tagline: $localize`:Project tagline@@projects.ailing.tagline:The assistant on this page: it answers questions about my career from a knowledge base I wrote.`,
    why: $localize`:Why the project exists@@projects.ailing.why:So this page can stay short while the detail is one question away.`,
    decision: $localize`:One engineering decision on the project@@projects.ailing.decision:It answers only from a knowledge base I wrote, and says so when a question isn't covered.`,
    stack: ['Cloudflare Workers', 'Hono', 'Vectorize', 'RAG', 'Angular'],
    status: {
      label: $localize`:Project availability@@projects.ailing.status:Open source`,
      icon: 'code',
    },
    featured: true,
    source: {
      label: $localize`:Link to the project's source code@@common.sourceLink:Source`,
      url: `${REPO_URL}/tree/main/apps/worker`,
      external: true,
    },
    hookLabel: $localize`:Ask AI Ling hook label@@projects.ailing.hookLabel:Ask how it works`,
    question: $localize`:Question sent to AI Ling@@projects.ailing.question:How does AI Ling work?`,
    flow: [
      {
        label: $localize`:Step in the AI Ling flow diagram@@projects.ailing.flow.question.label:Question`,
        detail: $localize`:Detail under a flow step@@projects.ailing.flow.question.detail:from this page`,
      },
      {
        label: $localize`:Step in the AI Ling flow diagram@@projects.ailing.flow.embed.label:Embed`,
        detail: 'Workers AI',
      },
      {
        label: $localize`:Step in the AI Ling flow diagram@@projects.ailing.flow.retrieve.label:Retrieve`,
        detail: $localize`:Detail under a flow step@@projects.ailing.flow.retrieve.detail:Vectorize, top 5 chunks`,
      },
      {
        label: $localize`:Step in the AI Ling flow diagram@@projects.ailing.flow.answer.label:Answer`,
        detail: 'Groq → Google AI → OpenRouter',
      },
    ],
  },
  {
    name: 'BJJ Quiz',
    icon: 'sports_martial_arts',
    tagline: $localize`:Project tagline@@projects.bjj.tagline:Twelve questions guess the Brazilian Jiu-Jitsu belt you roll like, then AI roasts you, gently.`,
    why: $localize`:Why the project exists@@projects.bjj.why:Just for fun, and to try an AI feature and Cloudflare Workers.`,
    decision: $localize`:One engineering decision on the project@@projects.bjj.decision:Scoring happens on the server, and a canned roast steps in if the AI call fails.`,
    stack: ['Angular', 'Cloudflare Workers', 'LLM'],
    status: { label: $localize`:Project availability@@common.statusLive:Live`, icon: 'public' },
    featured: false,
    primary: {
      label: $localize`:Link that opens the quiz@@projects.bjj.open:Take the quiz`,
      url: 'https://bjj-quiz.thanikc.workers.dev/',
      external: true,
    },
    hookLabel: $localize`:Ask AI Ling hook label@@projects.bjj.hookLabel:Ask how it works`,
    question: $localize`:Question sent to AI Ling@@projects.bjj.question:How does Thanik's BJJ Belt Quiz work?`,
  },
  {
    name: $localize`:Name of the retirement calculator project and page@@calculator.title:Retirement Calculator`,
    icon: 'calculate',
    tagline: $localize`:Project tagline@@projects.calculator.tagline:Projects the nest egg and monthly savings needed for a target retirement income.`,
    decision: $localize`:One engineering decision on the project@@projects.calculator.decision:Default assumptions load live from the World Bank API and fall back to fixed values when it has no data; the page prerenders as an empty shell so the static HTML never bakes in stale numbers.`,
    stack: ['Angular Signals', 'World Bank API'],
    status: { label: $localize`:Project availability@@common.statusLive:Live`, icon: 'public' },
    featured: false,
    primary: {
      label: $localize`:Link that opens the calculator page@@projects.calculator.open:Open calculator`,
      url: '/calculator',
      external: false,
    },
    hookLabel: $localize`:Ask AI Ling hook label@@projects.calculator.hookLabel:Ask where the numbers come from`,
    question: $localize`:Question sent to AI Ling@@projects.calculator.question:Where does the retirement calculator get its assumptions?`,
  },
];

/** What backs a principle: a question for AI Ling, or a link to the public repo. */
export type PrincipleEvidence =
  { kind: 'ask'; label: string; question: string } | { kind: 'link'; label: string; url: string };

/** A working habit, stated in one line and backed by something checkable. */
export interface Principle {
  title: string;
  detail: string;
  evidence: PrincipleEvidence;
}

export const PRINCIPLES: readonly Principle[] = [
  {
    title: $localize`:Working principle title@@principles.why.title:Find out why before changing it`,
    detail: $localize`:Working principle detail@@principles.why.detail:Before I patch a bug, I trace it to its root — like a portal timing problem that turned out to be an old time-to-market quick fix.`,
    evidence: {
      kind: 'ask',
      label: $localize`:Ask AI Ling hook label@@principles.why.hookLabel:Ask about that bug`,
      question: $localize`:Question sent to AI Ling@@principles.why.question:What was the timing problem Thanik traced back to a quick fix?`,
    },
  },
  {
    title: $localize`:Working principle title@@principles.tests.title:Tests first, even with AI`,
    detail: $localize`:Working principle detail@@principles.tests.detail:Red, green, refactor — and my AI assistants are held to the same loop.`,
    evidence: {
      kind: 'link',
      label: $localize`:Link to the repo's agent workflow document@@principles.tests.linkLabel:Read the workflow they follow`,
      url: `${REPO_URL}/blob/main/AGENTS.md`,
    },
  },
  {
    title: $localize`:Working principle title@@principles.rules.title:Give the AI rules, not just prompts`,
    detail: $localize`:Working principle detail@@principles.rules.detail:Not "let AI write everything" — written rules for architecture, coding standards and testing hold AI output to the same bar as a new hire's.`,
    evidence: {
      kind: 'ask',
      label: $localize`:Ask AI Ling hook label@@common.askTeamRulesLabel:Ask about the team rules`,
      question: $localize`:Question sent to AI Ling@@common.askTeamRulesQuestion:What are the AI rules Thanik wrote for his team?`,
    },
  },
  {
    title: $localize`:Working principle title@@principles.boring.title:Pick the boring option when it’s right`,
    detail: $localize`:Working principle detail@@principles.boring.detail:Reliable beats impressive: AI Ling returns whole answers instead of streaming them, so a failing provider can hand over to the next one.`,
    evidence: {
      kind: 'link',
      label: $localize`:Link to the worker README@@principles.boring.linkLabel:Read why it doesn’t stream`,
      url: `${REPO_URL}/blob/main/apps/worker/README.md`,
    },
  },
];

/** A concrete seniority/scale fact, backed by an Ask AI Ling hook instead of an adjective. */
export interface ExperienceStat {
  headline: string;
  detail: string;
  hookLabel: string;
  question: string;
}

export const EXPERIENCE_STATS: readonly ExperienceStat[] = [
  {
    headline: $localize`:Experience headline@@experience.years.headline:25+ years`,
    detail: $localize`:Experience detail@@experience.years.detail:In software since 1999; in banking and finance since 2010.`,
    hookLabel: $localize`:Ask AI Ling hook label@@experience.years.hookLabel:Ask about the roles`,
    question: $localize`:Question sent to AI Ling@@experience.years.question:What roles has Thanik had over his career?`,
  },
  {
    headline: $localize`:Experience headline@@experience.tenure.headline:10 years, one employer`,
    detail: $localize`:Experience detail@@experience.tenure.detail:Lead Programmer since 2016 — technical decisions and implementation on finance-sector client work.`,
    hookLabel: $localize`:Ask AI Ling hook label@@experience.tenure.hookLabel:Ask what that role involves`,
    question: $localize`:Question sent to AI Ling@@experience.tenure.question:What does Thanik do as Lead Programmer?`,
  },
  {
    headline: $localize`:Experience headline@@experience.leading.headline:Reviews, mentors, onboards`,
    detail: $localize`:Experience detail@@experience.leading.detail:Runs code reviews, mentors junior developers, and onboards new teammates to the codebase and architecture.`,
    hookLabel: $localize`:Ask AI Ling hook label@@experience.leading.hookLabel:Ask how he leads`,
    question: $localize`:Question sent to AI Ling@@experience.leading.question:How does Thanik mentor and lead within his team?`,
  },
  {
    headline: $localize`:Experience headline@@experience.aiRules.headline:Co-wrote the team's AI rules`,
    detail: $localize`:Experience detail@@experience.aiRules.detail:With the tech lead, introduced a binding set of AI rules — architecture, coding standards, tests — as the team’s minimum bar.`,
    hookLabel: $localize`:Ask AI Ling hook label@@common.askTeamRulesLabel:Ask about the team rules`,
    question: $localize`:Question sent to AI Ling@@common.askTeamRulesQuestion:What are the AI rules Thanik wrote for his team?`,
  },
];

/** A scannable line of the toolbox: a group name and its tools. */
export interface ToolGroup {
  name: string;
  tools: readonly string[];
}

/** Day-to-day tools by group; earlier or familiar-only tools go in the last group. */
export const TOOLBOX: readonly ToolGroup[] = [
  {
    name: $localize`:Toolbox group name@@toolbox.frontend:Frontend`,
    tools: [
      'Angular',
      'TypeScript',
      'RxJS',
      'Signals',
      'Web Components',
      'Nx',
      'Angular Material',
      'Tailwind CSS',
    ],
  },
  {
    name: $localize`:Toolbox group name@@toolbox.backend:Backend`,
    tools: ['Java', 'Spring Boot', 'Spring Security', 'Hibernate/JPA', 'REST', 'NestJS', 'Oracle'],
  },
  {
    name: $localize`:Toolbox group name@@toolbox.platform:Platform & delivery`,
    tools: ['OpenShift', 'Helm', 'Docker', 'Jenkins', 'CI/CD', 'Cloudflare Workers'],
  },
  {
    name: $localize`:Toolbox group name@@toolbox.quality:Quality`,
    tools: ['TDD', 'Playwright', 'Cypress', 'Jest', 'Vitest'],
  },
  {
    name: $localize`:Toolbox group name@@toolbox.ai:AI-assisted engineering`,
    tools: ['Claude Code', 'Kilo Code', 'OpenRouter', 'RAG'],
  },
  {
    name: $localize`:Toolbox group name for older or passing experience@@toolbox.alsoWorkedWith:Also worked with`,
    tools: ['Kubernetes', 'React', 'Vue', 'Swift', 'Android', 'Node.js', 'Ruby on Rails'],
  },
];

/** Something Thanik does away from the keyboard; one short line in his own voice. */
export interface Interest {
  name: string;
  description: string;
  icon: string;
}

export const INTERESTS: readonly Interest[] = [
  {
    name: $localize`:Interest name@@interests.swimming.name:Swimming`,
    description: $localize`:Interest description@@interests.swimming.description:Endurance, not speed — always chasing a cleaner stroke and a longer set.`,
    icon: 'pool',
  },
  {
    name: $localize`:Interest name@@interests.bouldering.name:Bouldering`,
    description: $localize`:Interest description@@interests.bouldering.description:Took it up after a spinal injury ended my BJJ — still physical, still problem-solving.`,
    icon: 'terrain',
  },
  {
    name: $localize`:Interest name@@interests.chess.name:Chess`,
    description: $localize`:Interest description@@interests.chess.description:The occasional game, when I want a slower kind of puzzle.`,
    icon: 'extension',
  },
  {
    name: $localize`:Interest name@@interests.mandarin.name:Learning Mandarin`,
    description: $localize`:Interest description@@interests.mandarin.description:Recently started, on top of German, English and Thai.`,
    icon: 'translate',
  },
];
