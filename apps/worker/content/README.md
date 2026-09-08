# Résumé content

Source of truth for the résumé chatbot's knowledge base. Each `*.md` file here is
ingested as **one document** by `scripts/ingest.mjs` (`pnpm --filter @thanikc/worker ingest`):
the worker chunks it (~800 chars, 100 overlap), embeds each chunk with
`@cf/baai/bge-base-en-v1.5`, and upserts into the `resume-rag` Vectorize index
with id `<filename>:<n>`.

## Format

- **File name = document id.** Keep it stable — re-ingesting overwrites the same
  chunk ids, so renaming a file orphans the old vectors.
- Plain Markdown. Write in full sentences and repeat context (name, company,
  role) so each chunk stands on its own when retrieved in isolation.
- Optional frontmatter for metadata (stored on every chunk, not used for
  filtering yet):

  ```
  ---
  title: Work History
  id: experience        # overrides the filename-derived id
  ---
  ```

## Re-ingesting

Run `pnpm --filter @thanikc/worker ingest` after any edit. Add `--url <worker-url>`
to target the deployed worker instead of `wrangler dev` on localhost.

Vectorize applies upserts asynchronously — `wrangler vectorize info resume-rag`
lags the ingest by a minute or two before `vectorCount` catches up and the new
chunks become retrievable. A `200 {ok, chunks}` response means the upsert was
accepted, not yet queryable.
