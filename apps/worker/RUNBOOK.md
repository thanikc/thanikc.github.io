# AI Ling runbook

Everything here runs on free tiers. If a step would need a paid plan, stop: degraded service is
the accepted failure mode, a bill is not. Commands run from `apps/worker/` with `CLOUDFLARE_API_TOKEN`
and `CLOUDFLARE_ACCOUNT_ID` set.

## Alerts and SLO

- **Alert:** an hourly workflow (`ai-ling-alerts.yml`) opens, or comments on, the one open issue
  labelled `ai-ling-alert`, and closes it once its checks pass. The nightly eval also raises it
  on failure (so the hourly check can close an eval alert early; re-run the eval to confirm).
  Thresholds: failed > 10 %, p95 > 15 s, failovers > 30 %, daily budget > 80 %, blocked answers
  more than 3× the 7-day hourly average (and at least 3). Fewer than 20 requests in the hour: no
  rate alert. They live in `scripts/alerts.mjs`.
- **SLO:** 99 % of valid requests answer `200` within 15 s, per month.

```sql
-- POST https://api.cloudflare.com/client/v4/accounts/<id>/analytics_engine/sql
SELECT sumIf(_sample_interval, blob4 = 'ok' AND double1 <= 15000) / sumIf(_sample_interval, blob4 IN ('ok', 'failed')) AS slo
FROM ai_ling_chat WHERE timestamp > NOW() - INTERVAL '30' DAY
```

## Kill switch

Stops all chat answers at once (503 with a localized message, no provider or index call):

```bash
pnpm exec wrangler deploy --var CHAT_DISABLED:true     # on
pnpm exec wrangler deploy                              # off (var is not in wrangler.jsonc)
```

Or set `CHAT_DISABLED` = `true` in the Cloudflare dashboard (Worker → Settings → Variables) and
delete it to switch back. A later push to `main` redeploys from `wrangler.jsonc` and clears a CLI-set var.

## Provider outage

The chain is Groq → Google AI → OpenRouter. A failing provider shows up as a `failover-rate` alert.
Reorder or drop one by changing `GROQ_MODEL` / `GOOGLE_MODEL` / `OPENROUTER_MODEL` in `wrangler.jsonc`
(a provider with no API key secret is skipped) and deploying. If all three fail, answers are 502
until one recovers; use the kill switch if the failure is noisy.

## Key rotation (quarterly, and on any suspicion)

| Secret                                                    | Rotate by                                                                                                                                  |
| --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `GROQ_API_KEY`, `GOOGLE_AI_API_KEY`, `OPENROUTER_API_KEY` | New key in the provider console → update the GitHub repo secret → re-run `deploy-worker` → revoke the old key                              |
| `INGEST_TOKEN`                                            | New random value → GitHub repo secret → re-run `deploy-worker` (CI mints short-lived tokens from it)                                       |
| `SESSION_SECRET`                                          | Same; open chat sessions and signed history end (visitors just re-verify). The answer cache survives, since answers are signed when served |
| `TURNSTILE_SECRET`                                        | Rotate in Cloudflare → Turnstile → GitHub repo secret → re-run `deploy-worker`                                                             |
| `CF_ANALYTICS_TOKEN`                                      | New token (Account Analytics: Read only) → GitHub repo secret                                                                              |

## Cloudflare token scope

`CLOUDFLARE_API_TOKEN` (deploy) should grant, for this account only: Workers Scripts: Edit,
D1: Edit, Vectorize: Edit, Workers AI: Read. Nothing zone-level. `CF_ANALYTICS_TOKEN` is a separate
token with Account Analytics: Read only. Ingest needs no Cloudflare token (it calls the worker with
`INGEST_TOKEN`). Check the token's permissions in the dashboard after any change.

## Cache purge

```bash
pnpm exec wrangler d1 execute CACHE_DB --remote --command "DELETE FROM answer_cache"
```

Deploys already do this. Do it by hand after a poisoning report, then use the kill switch first if the
bad answer is still being served.

## Orphan vectors

Removing or renaming a file in `content/` leaves its vectors in the index. Delete them by chunk id
(`<id>:<n>`; a document's chunks are numbered from 0):

```bash
pnpm exec wrangler vectorize delete-vectors resume-rag --ids <id>:0 <id>:1
```

Then clear the cache (above).

## Free-tier check (quarterly)

Confirm in each console that **no payment method or paid plan** is attached, so exceeding a quota can
only fail and never bill: Cloudflare (Workers Free), Groq, Google AI Studio (the key's project must
have no billing account linked), OpenRouter (no credits purchased). Record the date in the PR that
rotates the keys.
