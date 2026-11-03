# AI Ling Hardening, Phase 3 Implementation Plan (API robustness)

**Spec:** `docs/specs/2026-11-02-ai-ling-hardening-design.md` §5. Zero spend; absent config = feature off.
Order: Task 1 → 5, each RED → GREEN → REFACTOR. Worker tests `pnpm --filter @thanikc/worker test`;
UI tests `pnpm --filter @thanikc/ui test`. No new UI strings, so no i18n/privacy changes.

## Task 1: headers and body limits

- Files: `apps/worker/src/index.ts`, `apps/worker/test/api.spec.ts`.
- RED: every response (200, 400, 404, 413) carries `X-Content-Type-Options: nosniff`,
  `Cache-Control: no-store`, `Referrer-Policy: no-referrer`; `/api/chat` body > 32 KiB → 413 and
  `/api/ingest` > 1 MiB → 413, before any binding is touched.
- GREEN: `app.use('*', secureHeaders)` setting the three headers after `next()`;
  `bodyLimit({ maxSize, onError: c => c.json({ error: 'payload too large' }, 413) })` registered per path.

## Task 2: strict chat schema

- Files: `apps/worker/src/index.ts`, `apps/worker/src/rag.ts` (reuse `answerLanguage`), tests in `api.spec.ts`.
- RED: `locale: 'fr'`, `'constructor'`, a non-string → 400 `{ error: 'unsupported locale' }`; absent locale
  still fine; `history` of 7 entries → 400 `{ error: 'history is too long' }`; the "Klingon", "inherited
  property" and "caps history" tests are rewritten accordingly (per-turn 2000-char cut stays).
- GREEN: validate right after the JSON parse; `history` no longer sliced.

## Task 3: ingest id, short-lived token, audit log

- Files: `apps/worker/src/{index,gate,ingest}.ts`, `apps/worker/scripts/ingest.mjs`, tests in
  `api.spec.ts`, `gate.spec.ts`, `cache.spec.ts` (ingestDoc helper), `ingest.spec.ts`.
- Models: `issueSession(secret, now?, ttl = SESSION_TTL_SECONDS)`; `INGEST_TOKEN_TTL_SECONDS = 600`;
  `ingest()` returns `{ chunks, skipped, hash }`.
- RED: `id` not matching `^[a-z0-9-]{1,64}$` → 400; `Bearer <expires>.<hmac(INGEST_TOKEN)>` accepted, the raw
  `INGEST_TOKEN`, an expired token and a wrong-signature token → 401; a successful ingest logs one JSON
  audit line `{ event: 'ingest', id, chunks, skipped, hash, requestId }`; `ingest.mjs` exports
  `mintToken(secret, now)` that `verifySession` accepts.
- GREEN: handler verifies with `verifySession(token, INGEST_TOKEN)`; `sameSecret` is removed (orphaned);
  script sends `mintToken(...)` per request.

## Task 4: signed assistant turns (worker)

- Files: `apps/worker/src/{index,gate}.ts`, tests in `gate.spec.ts`, `api.spec.ts`.
- Models: `signAnswer(secret, answer): Promise<string>`, `verifyAnswer(secret, answer, sig): Promise<boolean>`;
  history item `{ role, content, answerSig?: string }`; response gains `answerSig` on every body that has an `answer`.
- RED: with `SESSION_SECRET` set, responses (fresh, exact/semantic cache hit, decline, busy) carry a valid
  `answerSig`; an assistant history turn without or with a wrong sig is dropped together with the user turn
  right before it; a valid one is kept (and `answerSig` is not forwarded to the provider). Without
  `SESSION_SECRET` history behaves as before and no sig is added.
- GREEN: a `reply(body)` helper in the chat handler adds the sig; `dropForgedTurns(history, secret)` runs before
  the 2000-char cut and redaction (it must verify the original text).

## Task 5: UI stores and returns the signature

- Files: `apps/ui/src/app/domains/chat/chat.{models,service}.ts`, `chat.service.spec.ts`.
- Models: `ChatTurn.answerSig?: string`; `ChatResponse.answerSig?: string`.
- RED: the assistant turn keeps the response's `answerSig`; the next request's `history` includes it on that turn
  (and no `sources`); user turns never carry one.
- GREEN: `recent()` keeps `answerSig`; `ask()` stores it.
- Docs: `apps/worker/README.md` endpoint table and current-design spec rows updated.
