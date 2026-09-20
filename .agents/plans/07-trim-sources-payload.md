# Plan 07 — Return source titles, not full chunk bodies

**Why:** `/api/chat` returns `sources: chunks` — five stitched chunks, up to ~2.4KB
each — but the UI reads only `title` (`apps/ui/src/app/domains/chat/chat.service.ts`,
`titlesOf`). The bodies are pure payload weight on every answer. Minimum disclosure is
also the defensible default even when the content is public.

**Touches:** `apps/worker/src/index.ts`, `apps/worker/test/chat.spec.ts`,
`apps/ui/src/app/domains/chat/chat.models.ts` (drop the unused field from the type).

## Steps

1. RED: `/api/chat` response `sources` entries carry `title` and `score` and no `text`.
2. GREEN: map before returning — `chunks.map(({ title, score }) => ({ title, score }))`.
3. Update `ChatSource` in the UI model and its spec; the `titlesOf` logic is unchanged.

**Done when:** worker and UI tests green, answers noticeably smaller on the wire.

**Non-goals:** changing what the UI shows, citation markers in the answer text.
