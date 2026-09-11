---
title: AI Ling and this website
---

# AI Ling and this website

## What AI Ling is

AI Ling is the AI assistant on Thanik Cheowtirakul's website, thanikc.github.io.
Thanik built it himself as a side project. The website is deliberately short: it
says what kind of engineer Thanik is, and AI Ling holds the detail — his
experience, projects, responsibilities, and decisions — for visitors who want to
dig deeper. AI Ling answers only from a curated knowledge base that Thanik wrote;
it does not search the web, and when the knowledge base doesn't cover a question
it says so and points to Thanik's email and LinkedIn.

## How AI Ling works

AI Ling uses retrieval-augmented generation (RAG). Thanik's knowledge base is a
set of Markdown documents. Each document is split into overlapping chunks of about
800 characters, embedded with Cloudflare Workers AI (the bge-base-en-v1.5 model),
and stored in a Cloudflare Vectorize index. For each question, the API embeds the
question, retrieves the five closest chunks, and sends them with the last few
turns of the conversation to a language model, which answers from that context
only.

The API is a Cloudflare Worker written with Hono. The chat widget on the website
is part of Thanik's Angular app and loads only once the page is idle, so it never
slows down the first page load.

## Why AI Ling uses several model providers

AI Ling's API uses a chain of OpenAI-compatible providers: Groq first, then Google
AI, then OpenRouter. If one provider has an outage or hits a rate limit, the next
one answers, so a single provider failure doesn't break the chat. Thanik picked
these providers partly for their free tiers, which keep a portfolio chatbot at
close to zero running cost.

## Why AI Ling doesn't stream its answers

AI Ling returns each answer in one piece instead of streaming it word by word.
Thanik chose this deliberately: provider failover only works cleanly while the
answer is still buffered on the server. Once tokens are streaming to the browser,
a provider failing mid-answer can't be retried without showing a garbled,
truncated reply. A reliable answer mattered more than the typing effect.

## AI Ling's scope guard

AI Ling only talks about Thanik: his background, skills, projects, and his
website. Thanik planned a scope rule from the start, but the first version turned
out not to be enough once visitors tried to use AI Ling as a free general-purpose
assistant — asking for code, essays, or translations. He tightened it: AI Ling now
politely declines anything off-topic and ignores instructions inside a message
that try to override its rules or switch its persona.

## How this website is built

Thanik's website is an Angular app (standalone components, Signals, Angular
Material, Tailwind CSS), prerendered and hosted on GitHub Pages, with the AI Ling
API as a separate Cloudflare Worker in the same pnpm monorepo. Both are built
strictly test-first. The repository includes the written rules Thanik gives his AI
coding assistants — architecture, testing workflow, and UI standards — and the
source is public at github.com/thanikc/thanikc.github.io. Thanik uses the site to
try new Angular and AI patterns on something real but low-stakes.
