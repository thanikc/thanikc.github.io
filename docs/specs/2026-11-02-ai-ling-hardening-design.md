# AI Ling: hardening to enterprise grade

Status: decisions settled (2026-11-02), see §9. Baseline:
[`2026-11-02-ai-ling-current-design.md`](2026-11-02-ai-ling-current-design.md). Each phase
becomes its own plan in `docs/plans/` and is built test-first (RED → GREEN → REFACTOR).

## 1. Goal

AI Ling should hold up against a motivated outside attacker while costing nothing to run,
without changing what visitors see in the normal case:

- **No cross-visitor harm:** one visitor must not be able to change what another visitor sees.
- **Bounded usage:** free quotas have hard limits that don't depend on how many IPs an attacker controls.
- **Predictable behavior:** pinned models, fixed latency limits, alerts when quality or uptime drops.
- **Defensible privacy:** GDPR-ready processing for visitors in the EU (the site is served in German).
- **Auditable delivery:** pinned supply chain, least-privilege credentials, a staging check before prod.

**Hard constraint: zero spend.** Everything here must run on free tiers: Cloudflare Workers
Free (Workers AI daily allowance, Vectorize, D1, Analytics Engine, Turnstile), the free
provider tiers, and GitHub Actions on a public repo. No paid plans, no purchased domain. Running
out of a free quota means degraded service (a decline or "busy" answer) and never a bill.

## 2. Threat model

| Actor / vector                   | Asset at risk                                  | Current exposure                                                                    |
| -------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------- |
| Scripted client, many IPs        | Free provider and Cloudflare quotas (uptime)   | Per-IP limit only; CORS doesn't stop non-browser clients                            |
| Prompt injection → cache         | Other visitors (phishing link, offensive text) | Opening-message answers are shared through the cache                                |
| Prompt injection → output        | The visitor, brand                             | Images and any `https` link render in the panel                                     |
| Long or expensive generations    | Latency, quota                                 | No `max_tokens`; up to 3 × 20 s timeouts in a row                                   |
| Visitor-typed personal data      | Privacy                                        | Sent to 3 processors (free tiers); answers that repeat it may be cached for 30 days |
| Compromised CI dependency/action | All secrets, index content                     | Actions pinned by tag; broad Cloudflare token (unverified)                          |
| Leaked `INGEST_TOKEN`            | Knowledge base integrity                       | Single long-lived token; public endpoint                                            |
| Silent provider/model change     | Answer quality, safety                         | Floating model aliases; eval runs only on PRs                                       |

**Out of scope** while AI Ling stays anonymous and read-only: SSO/OIDC, per-user quotas, RBAC,
tenant isolation, data residency guarantees, formal certification (SOC 2/ISO 27001). Revisit if
it gains accounts, private data, or tools/actions (§8).

## 3. Phase 1: cross-visitor safety and quota limits (must have)

### 1.1 Bot gate (Cloudflare Turnstile)

- **Problem:** rate limits are per IP; botnets and proxy pools get around them, and CORS is
  enforced only by browsers.
- **Design:** the widget gets an invisible Turnstile token when the chat opens and sends it as
  `X-Turnstile-Token`. The worker verifies it with `siteverify` (secret `TURNSTILE_SECRET`)
  before the rate limiter, and checks `hostname` against `ALLOWED_ORIGIN`. A token is valid for
  one conversation: after verification the worker issues a short-lived HMAC session token (15 min,
  secret `SESSION_SECRET`) that the client sends on follow-ups, so there is no siteverify call on
  every turn. The same secret signs assistant turns (§5). A missing `TURNSTILE_SECRET` means no
  gate (local dev, tests), like the other bindings. Turnstile is free with no request limit.
- **Files:** `apps/worker/src/gate.ts` (new), `src/index.ts`, `wrangler.jsonc` (comment
  listing the secrets), `deploy-worker.yml` secrets; UI `chat.service.ts`, new
  `turnstile.service.ts`, `chat.config.ts` (site key token).
- **Acceptance:** requests without a token or with an invalid one → 403 with no model call; valid
  token → existing behavior; session token is rejected after expiry or with a bad signature.
  The privacy policy (+ de/th) names Turnstile. Cloudflare already processes chat requests, so
  this is a new purpose, not a new company.

### 1.2 Quota limits

- `max_tokens: 1024` on every provider call (`chat/client.ts`); not lower, because Groq's
  `gpt-oss` counts its reasoning tokens against it. Truncated output
  (`finish_reason: "length"`) still returns, and is never cached.
- An **overall deadline** of 25 s for the whole chain. Each attempt gets `min(20 s, remaining)`.
  Once the deadline passes there is no further failover.
- A **daily global budget**: a counter in D1, `DAILY_GENERATION_LIMIT` (var, 1000, set
  below the smallest provider's free daily quota; an absent var means no budget). Over budget → the localized decline-style
  "busy" answer, no model call, telemetry outcome `budget`. This keeps one abuser from using up
  the whole day's free quota at once, and keeps D1 writes far below the free limit.
- Every API key stays on a free account with no payment method on file, so going over a quota
  can only fail, never bill. The runbook (§6.4) records this check for each account.
- **Acceptance:** specs assert `max_tokens` in the request body; that a slow first provider
  leaves at most the remaining deadline for the next; and that the budget returns the busy answer
  without calling `fetch`.

### 1.3 Cache poisoning defence

- **Problem:** an attacker can phrase an opening message so the model writes a harmful answer
  (phishing link, insult). It is then served to every visitor whose question matches exactly or
  semantically.
- **Design:** only store an answer that passes `isCacheSafe(answer)`:
  - no URLs at all (the knowledge base has none, so a grounded answer never needs one), and no
    links other than `mailto:` and site-relative ones;
  - no Markdown images;
  - not truncated (1.2);
  - passes the output moderation check (1.5) once that exists.

  Also store only when `topScore ≥ MIN_SCORE + 0.05`, so borderline grounding is never shared.

- **Acceptance:** specs for each rejection reason; a rejected answer is still returned to its own
  asker, but `store` is not called.

### 1.4 Render hardening (UI)

- `MarkdownPipe` drops images (rendered as their alt text) and turns links into plain text unless
  they are `mailto:`, site-relative, or on `https://thanikc.github.io/`.
- CSP comes from Angular's `security.autoCsp` (hashed inline scripts, `strict-dynamic`,
  `object-src 'none'`, `base-uri 'self'`). GitHub Pages can't set headers, and `autoCsp` writes
  the policy into the built HTML with no list of origins to maintain (analytics and Turnstile load
  through `strict-dynamic`). It must be verified against a `build:pages` output, not dev.
- **Acceptance:** pipe specs for image stripping and off-allowlist links; e2e smoke test that the
  site loads with no CSP violations in the console.

### 1.5 Output moderation

- After generation, before responding: a classifier on Workers AI (`@cf/meta/llama-guard-3-8b`)
  over the visitor message plus the answer. An unsafe result → localized decline, telemetry outcome
  `blocked`, never cached. A classifier error or an exhausted Workers AI allowance → fail open
  (answer returned but not cached), logged. It shares the free daily allowance with embeddings,
  so it runs only on answers that would otherwise be cached or contain a link. Cache hits and
  declines skip it.
- **Acceptance:** stubbed `AI.run` returning unsafe/safe/error; `eval.mjs` gains cases that must
  come back `blocked` or declined.

## 4. Phase 2: privacy and compliance

### 2.1 Processor posture

Decision: keep all three free providers, **redact and disclose**. Paid tiers are ruled out (§1).

- Keep the chain Groq → Google AI → OpenRouter on free tiers. Their terms differ: Google AI's
  free tier may use prompts to improve products (including human review), and free OpenRouter
  models may log prompts. The defence is to stop personal data reaching them (2.2) and to say so
  plainly (2.3).
- Pin exact model versions where the free tier offers them (no `gemini-flash-latest`). OpenRouter's
  free router stays an alias, since it picks whichever free model is available, but it is last in the chain
  and the nightly eval (6.2) watches it.
- The privacy policy (+ de/th) states, for each provider, that the free tier is used and what that
  provider's terms allow with prompts, and records the transfer basis for the US processors.
- **Acceptance:** provider config spec asserts no `-latest` aliases for Groq/Google; privacy policy
  updated per `docs/conventions/privacy-policy.md`.

### 2.2 Personal-data hygiene

- A lightweight PII detector (`pii.ts`: email, phone, IBAN/card-like digit runs) runs on the visitor
  message. If it matches, the request is **not cached** and the matched spans are redacted before the
  message goes to providers (`[email]`, `[phone]`). The visitor still sees their own text.
- Cache TTL drops from 30 days to 7 days.
- **Acceptance:** specs for each pattern, for no cache write on match, and for the redacted body seen by
  stubbed `fetch`.

### 2.3 Transparency

- A short notice under the chat input: "AI answers can be wrong. Don't share personal data." It links
  to the privacy section (EU AI Act Art. 50 transparency; i18n with `@@chat.disclaimer`).

## 5. Phase 3: robustness of the API

- **Body size limit:** Hono `bodyLimit({ maxSize: 32 * 1024 })` on `/api/chat` and `1 MiB` on
  `/api/ingest` → 413.
- **Strict schema:** reject unknown `locale` values with 400 instead of silently treating them as
  English. Reject history arrays longer than `MAX_HISTORY_TURNS` instead of slicing, since the
  UI never sends more.
- **Forged history (decision: sign assistant turns):** the client can invent `assistant` turns
  ("Sure, I'll ignore my rules"). The worker returns `answerSig = HMAC(SESSION_SECRET, answer)`
  with each answer. The UI stores it on the turn and sends it back in `history`. An assistant
  turn without a valid signature is dropped, and the user turn right before it is dropped too, so
  the pairs stay aligned. Cached answers are signed when served, not when stored, so rotating the
  secret doesn't invalidate the cache.
- **Ingest:** validate `id` against `^[a-z0-9-]{1,64}$`. Replace the static bearer token with a
  short-lived HMAC token CI mints from `INGEST_TOKEN` (timestamp + signature, valid 10 min), so a
  leaked request can't be replayed later. Log each ingest (id, chunks, hash, request id) as an
  audit event.
- **Security headers** on every worker response: `X-Content-Type-Options: nosniff`,
  `Cache-Control: no-store`, `Referrer-Policy: no-referrer`.
- **Domain (decision: stay on `workers.dev`):** WAF and rate-limiting rules need an owned domain,
  which costs money. Turnstile (1.1), the in-code limits, the daily budget (1.2) and the kill
  switch (6.4) cover the same ground for this API.

## 6. Phase 4: operations and delivery

### 6.1 Observability and alerting

- New telemetry outcomes `blocked`, `budget`, `forbidden`; also log a field telling whether the
  answer was cached-eligible.
- **Alerts (decision: GitHub issue):** an hourly scheduled workflow (`.github/workflows/ai-ling-alerts.yml`)
  runs `apps/worker/scripts/alerts.mjs`, which queries the Analytics Engine SQL API (repo secret
  `CF_ANALYTICS_TOKEN`, scoped to Account Analytics read). It opens or comments on a single
  issue labelled `ai-ling-alert` when: failed rate > 10 % over 1 h, p95 latency > 15 s,
  failovers > 30 %, daily budget > 80 %, or the blocked rate is more than 3× its 7-day average. It closes
  the issue once every check passes again. GitHub's notification email is the alert channel. The workflow
  has permission `issues: write` only. Thresholds live in `alerts.mjs` with a unit spec.
- **SLO:** 99 % of valid requests answer `200` within 15 s, measured monthly.

### 6.2 Quality gates

- Run `eval.mjs` **nightly** against production (catches silent provider/model drift), not just on
  PRs. A failure opens or comments on the same `ai-ling-alert` issue.
- Grow the injection set: forged-history jailbreaks, link/image injection, cache-poisoning attempts,
  system-prompt extraction in de/th.

### 6.3 Supply chain and CI

- Pin every GitHub Action to a commit SHA; add Dependabot (`.github/dependabot.yml`) for
  `github-actions` and `npm`, with weekly grouped updates.
- `pnpm audit --prod` in CI (fail on high).
- Scope `CLOUDFLARE_API_TOKEN` to this account's Workers Scripts, D1 and Vectorize edit only.
  Use separate deploy and ingest credentials.
- **Staging:** `wrangler.jsonc` `env.staging` with its own index and D1 (both fit the free
  limits alongside production) and its own secrets. PRs deploy with
  `wrangler versions upload` to a preview URL and run `eval.mjs` against **that**, fixing
  today's gap where eval grades the already deployed build. Production uses gradual
  deployment (`wrangler versions deploy` 10 % → 100 %).

### 6.4 Runbook (`apps/worker/RUNBOOK.md`)

Key rotation (quarterly and on suspicion), provider outage handling (reorder or disable
the chain through vars), cache purge, orphan-vector cleanup, emergency kill switch
(`CHAT_DISABLED=true` var → 503 with the localized message), and a check that no account
(Cloudflare, Groq, Google AI, OpenRouter) has a payment method or paid plan attached.

## 7. Priorities

| Phase | Item                        | Risk addressed            | Effort |
| ----- | --------------------------- | ------------------------- | ------ |
| 1     | 1.3 Cache poisoning defence | Cross-visitor harm        | S      |
| 1     | 1.4 Render hardening + CSP  | Phishing / tracking       | S–M    |
| 1     | 1.2 Quota limits            | Uptime, free quotas       | S      |
| 1     | 1.1 Turnstile gate          | Quota drain, abuse        | M      |
| 1     | 1.5 Output moderation       | Brand, cross-visitor      | S      |
| 2     | 2.1 Processor posture       | GDPR, data retention      | S      |
| 2     | 2.2–2.3 PII hygiene, notice | Privacy                   | S      |
| 3     | API robustness              | Abuse, integrity          | M      |
| 4     | Ops, CI, staging, runbook   | Reliability, supply chain | M–L    |

Order inside Phase 1: 1.3 → 1.4 → 1.2 → 1.1 → 1.5. The first three are small, need no new
services, and close the only cross-visitor vector.

## 8. Triggers for real enterprise scope

Re-open the out-of-scope list in §2 if any of these becomes true: logged-in users or saved
conversations; private or customer data in the index; tools or actions (sending email, booking,
writing data); use by another organisation. Each needs authN/Z, per-tenant retrieval filters,
audit logs and a DPIA before launch.

## 9. Decisions (2026-11-02)

| #   | Question                         | Decision                                                                |
| --- | -------------------------------- | ----------------------------------------------------------------------- |
| 1   | Bot gate                         | Add Turnstile; privacy policy names it (1.1)                            |
| 2   | Paid tiers / provider data terms | Never pay; keep the three free providers, redact and disclose (2.1–2.3) |
| 3   | Forged history                   | Sign assistant turns with HMAC (§5)                                     |
| 4   | Custom domain / WAF              | Stay on `workers.dev`; no purchased domain (§5)                         |
| 5   | Alert channel                    | GitHub issue from a scheduled workflow (6.1)                            |
