// Secrets are not known to `wrangler types`, so declare them here (merged with the
// generated `Env` in worker-configuration.d.ts). Set them with `wrangler secret put`
// locally, or via the GitHub Actions `secrets:` block in CI.
interface Env {
  GROQ_API_KEY?: string;
  GOOGLE_AI_API_KEY?: string;
  OPENROUTER_API_KEY?: string;
  INGEST_TOKEN?: string;
}
