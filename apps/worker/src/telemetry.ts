export interface ChatPoint {
  requestId: string;
  provider: string;
  locale: string;
  cache: 'none' | 'exact' | 'semantic';
  outcome: 'ok' | 'refused' | 'failed';
  latencyMs: number;
  /** Top retrieval score, or -1 when retrieval never ran (exact cache hit). */
  topScore: number;
  /** Providers that failed before the answer (or all of them, when outcome is failed). */
  failovers: number;
  answerLength: number;
}

/**
 * One Analytics Engine point per chat request. Aggregate metrics only: the question,
 * the answer and the client IP are never recorded (see the privacy policy page).
 * An absent binding (local dev, tests) records nothing.
 */
export function record(env: Env, p: ChatPoint): void {
  try {
    env.ANALYTICS?.writeDataPoint({
      blobs: [p.provider, p.locale, p.cache, p.outcome, p.requestId],
      doubles: [p.latencyMs, p.topScore, p.failovers, p.answerLength],
      indexes: [p.provider],
    });
  } catch {
    // Telemetry must never break an answer.
  }
}
