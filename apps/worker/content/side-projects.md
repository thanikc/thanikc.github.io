---
title: Side projects
---

# Side projects

Outside of client work, Thanik Cheowtirakul builds complete small products on his
own, from the data model to deployment. His side projects are CrashDash, AI Ling
(the assistant on his website), the BJJ Belt Quiz, and a retirement calculator.

## CrashDash — crash risk dashboard

CrashDash is Thanik's crash risk dashboard: an informational early-warning system
that monitors market and macroeconomic indicators to assess the risk of a market
crash or recession. It never trades and never connects to a broker. Thanik built
it for three reasons: to support his own investment decisions, to practise
building a complete system on his professional stack end to end, and to see how
far AI-assisted development goes on a full system.

CrashDash is private. It runs at crashdash.singdee.de, but only accounts on an
allowlist can use it: visitors sign in with Google or GitHub, and new sign-ins wait
for an administrator to approve them. There are no public screenshots or public
source code.

## CrashDash — architecture

CrashDash has a Spring Boot back end and an Angular front end. Its economic time
series come from the FRED API of the Federal Reserve Bank of St. Louis. The front
end shows an overview of the current risk level, the individual indicators,
charts, and a signal timeline, and it alerts the user to new signal events,
emphasising orange and red ones. Thanik names data ingestion as the hardest engineering
problem in CrashDash: indicator data arrives with gaps and missing values, and the
risk model has to stay honest when it does.

## CrashDash — how the risk level is computed

In CrashDash, each indicator — for example the S&P 500 drawdown, the high-yield
credit spread, or a re-steepening yield curve — produces a score from 0 to 100.
When an indicator's data is missing, the indicator stays unscored; it is never
defaulted to zero, because a zero would look like "no risk" rather than "no data".

Scores roll up in two levels. Indicator scores form a category score, the
weighted mean of only the scored indicators in that category, with the weights
renormalised over the indicators that have data. Category scores then form the
overall 0–100 score the same way. Anything that could not be scored is excluded
rather than zeroed, and the result is flagged as missing or incomplete data.

## CrashDash — risk bands and confirmation

CrashDash maps the overall score to a band: below 25 is green, below 50 yellow,
below 70 orange, and anything higher red. That band is the base state.

Indicators are also tagged as early-warning or confirmation indicators. Each tier
is checked against a configured rule — a minimum score, a minimum number of
elevated indicators, and a minimum number of scored indicators before the tier is
judged at all — giving triggered, not triggered, or indeterminate. Only when both
tiers trigger at the same time is the base state raised by a configured number of
bands, capped at red. Escalation only ever raises the state, never lowers it.

The whole trail — category scores, contributing indicators, tier verdicts, and
exclusions — is kept with every result and exposed through the API, so each risk
level can be explained and audited rather than taken on trust.

## BJJ Belt Quiz

The BJJ Belt Quiz is a small, deliberately fun project by Thanik: twelve questions
that guess which Brazilian Jiu-Jitsu belt you "actually roll like", followed by a
lighthearted roast generated live by AI. It runs at bjj-quiz.thanikc.workers.dev.
Thanik built it just for fun, to try an AI feature inside a small product, and to
try deploying an Angular app with its API on Cloudflare Workers.

The quiz is an Angular app on Cloudflare Workers with its own small API: one
endpoint serves the questions, another scores the submitted answers. Scoring
happens on the server, so the browser can't fake a belt. The roast comes from an
LLM provider setup similar to AI Ling's; its prompt has guardrails that keep the
roast lighthearted, and a canned fallback roast appears if the AI call fails. The
source code is private.

## Retirement calculator

The retirement calculator on Thanik's website is a small tool: it projects the
nest egg needed for a target monthly retirement income and the monthly savings
needed to close the gap. It is built with Angular Signals. Its default
assumptions come live from the World Bank open data API — US consumer price
inflation and a 15-year average of annual stock market returns — and fall back to
fixed defaults when the API has no data. The page is prerendered as a shell, and
the live-data part loads only in the browser, so the static HTML never contains
stale numbers.
