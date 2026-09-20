# Plan 06 — Re-ingest changed content automatically, idempotently

**Why:** the README admits it — "Pushing content does not re-ingest it." The knowledge
base silently drifts from what is committed, and the fix today is remembering to run a
script. This is the content-freshness gap, and it is also what bumps the cache epoch
from plan 03.

**Touches:** `apps/worker/src/ingest.ts`, `apps/worker/src/index.ts`,
`apps/worker/scripts/ingest.mjs`, new workflow, `apps/worker/test/ingest.spec.ts`.

## Steps

1. RED: ingesting a document whose content hash matches what is already stored skips
   embedding entirely and reports `{ ok: true, chunks: 0, skipped: true }`.
2. GREEN: store `contentHash` (SHA-256 of the raw doc text) in every chunk's metadata;
   before chunking, query the index for `${docId}:0` and compare. Embedding is the
   expensive part — skipping it is the whole point.
3. GitHub Action on push to `main` touching `apps/worker/content/**`: run
   `ingest:deployed` with `INGEST_TOKEN` from repo secrets.
4. Deleted or renamed documents leave orphan vectors behind. Either delete by
   `docId` prefix before upserting, or accept it and say so in the README — but decide,
   don't leave it undefined.
5. Bump `CACHE_EPOCH` after a successful ingest run (plan 03 step 8).

**Done when:** editing a content file and pushing updates the live index without a
manual step, an unchanged file costs no embeddings, re-running the workflow is a no-op.

**Non-goals:** incremental per-chunk diffing, a content CMS, scheduled re-ingest,
rollback of a bad ingest.
