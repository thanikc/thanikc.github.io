# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Four audiences, all evaluating Thanik Cheowtirakul as an engineer:

- **Hiring managers and tech leads** judging engineering depth and judgment, often technically.
- **Recruiters** skimming for fit: seniority, stack, availability, working languages.
- **Freelance and contract clients** looking for someone to deliver a project.
- **Peer engineers** arriving through AI Ling, the AI-practice angle, or the public source code.

Retirement-calculator visitors are a separate group: people using the tool to plan their own retirement.

## Product Purpose

A personal portfolio for a senior full-stack engineer (25+ years, banking/finance, enterprise Angular + Spring Boot). It should communicate: "an experienced engineer figuring out how AI changes serious software, and here's the evidence." The page itself is deliberately short and says what kind of engineer Thanik is. AI Ling, a RAG chat assistant, holds the detail for visitors who want to dig deeper.

Success means a visitor who could hire or work with Thanik leaves convinced of his seniority and judgment and knows how to reach him (email or LinkedIn).

## Positioning

The site itself is the evidence. It is a production-grade Angular app (SSR, zoneless, Signals, three-locale i18n, a11y and design e2e checks) with a self-built RAG assistant that answers only from a knowledge base Thanik wrote. It shows the claimed craft and AI practice instead of just describing them.

## Operating Context

- Routes: profile (`/`), retirement calculator (`/calculator`), privacy policy (`/privacy-policy`).
- AI Ling is a floating chat widget on every page, backed by `apps/worker`. It loads only once the page is idle.
- The profile page's section order is set on purpose, judgment before evidence before tech: Hero → Ask AI Ling → How I work → Experience → What I work on → Projects → Toolbox → Interests.
- Hosted on GitHub Pages. Thanik is not actively job hunting but is open to senior, lead, or tech lead roles: permanent, freelance/contract, or part-time; remote; German and English.

## Capabilities and Constraints

- **Retirement calculator is a real tool for visitors**, not just a demo. People should be able to plan with it, so trust, clear assumptions, and correct numbers matter. It uses live World Bank API data for its projection assumptions.
- **Three locales (en, de, th)** are built separately. Every user-facing string is translated, and layout must hold for longer German words and for Thai wrapping.
- **Privacy policy is a factual inventory** of storage keys, processors, and legal bases. It changes whenever the site's data handling changes.
- Analytics run behind cookie consent.
- Stack is fixed by the codebase: Angular (standalone, Signals), Angular Material, Tailwind; strict TDD (see `AGENTS.md`).

## Brand Commitments

- Name: Thanik Cheowtirakul. Assistant name: AI Ling (never translated).
- The hero shows no employer name and no bare "N years". Concrete numbers belong in the Experience section, and specs lock this rule in place.
- AI Ling is framed as an invitation to explore, not a tech demo.
- Existing assets: `public/img/logo.svg`, `logo.png`, `og-card.svg/png`, `chat_avatar_352x432.png`, app icons.

## Evidence on Hand

- `apps/worker/content/*.md` is the single source of truth for every claim about Thanik: experience, projects, how he works, AI practice, education, languages, interests, and the roles he's open to. AI Ling answers from the same files.
- Real project history (German cooperative-banking IT, CRM vendor) is in `projects.md`. Client names are anonymized there and must stay that way.
- No testimonials, references, or client logos exist. Do not invent any.

## Product Principles

1. **Show, don't claim.** Every assertion traces to the knowledge base, and the site's own engineering is part of the proof.
2. **Short page, deep assistant.** The page gives the judgment and the headline evidence, and AI Ling carries the detail.
3. **Judgment before résumé.** Lead with how Thanik thinks and decides, then experience, then tech.
4. **Equal in every language.** German and Thai visitors get the same quality as English ones, not a fallback.
5. **Tools are trustworthy.** Anything a visitor relies on, like the calculator, is accurate and states its assumptions.

## Accessibility & Inclusion

Automated axe checks (no serious/critical violations, color contrast) and a non-text-contrast check for cards run in `e2e/design.e2e.ts` at 360px and 1440px in all three locales.
