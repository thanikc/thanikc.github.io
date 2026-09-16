---
title: How Thanik uses AI in engineering
---

# How Thanik uses AI in engineering

## AI as an engineering multiplier

Thanik Cheowtirakul uses AI as a multiplier for his engineering work, not as a
replacement for engineering judgment. The AI does more of the typing and
searching; the decisions, the review, and the responsibility stay with him.

## Tools Thanik uses

Day to day, Thanik works with Claude Code for agentic coding, with ChatGPT and
Claude chat for exploration and explanations, and with Kilo Code connected to
models through OpenRouter.

## What Thanik uses AI for

Thanik uses AI across the whole development loop: writing tests and driving
test-driven development, reviewing code and spotting bugs and inconsistencies,
exploring unfamiliar code and weighing design options, and routine
implementation, refactoring, and large mechanical migrations.

## Where Thanik doesn't rely on AI

Some things Thanik deliberately keeps in human hands or always verifies himself:
architecture decisions (the AI can propose options, but the decision stays with
him and the team), anything touching security or customer data, and domain and
business rules such as banking and tax logic, which are checked against the
specification rather than the AI's guess. Nothing AI-generated is merged without
review and passing tests.

## Team AI rules at a cooperative-banking IT service provider

At a German cooperative-banking IT service provider, Thanik and the tech lead
introduced AI-assisted development to their Angular team, at a time when
agentic coding wasn't yet permitted there — AI meant assistant-style tools
such as autocomplete and chat, and code review stayed the traditional
line-by-line kind. Together they wrote a binding set of AI rules that serves
as an architectural guideline and minimum standard for the whole team. The
rules cover architecture guidelines, coding standards, and testing
requirements, so that AI-assisted code meets the same bar as code written by
hand.

## The shift from prompting to specifying, on Thanik's own projects

On his own projects, where agentic coding tools genuinely do the
implementation, Thanik has felt the bottleneck in software engineering move.
Typing code and converting tickets into implementation stopped being the hard
part once agents could generate functional code faster than a human can read
it. What got harder instead: writing specifications precise enough that an
agent can't misinterpret them, reviewing for architectural intent and
edge-case coverage before or during generation rather than line-by-line
afterward, and treating the test suite itself as the specification an agent
must satisfy so it can refactor safely. His website repository contains the
rules his AI coding assistants must follow under this approach: a strict
test-driven workflow, the architecture and coding standards, and a set of UI
and accessibility standards. He also builds AI into products: AI Ling, the
assistant on his website, and the AI-generated roast in his BJJ Belt Quiz.
