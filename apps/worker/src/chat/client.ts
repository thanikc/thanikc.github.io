import { resolveProviders, type ProviderConfig } from './providers';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateResult {
  answer: string;
  provider: string;
  /** Providers that failed before this one answered. */
  failovers: number;
  /** The completion was cut at the token cap. */
  truncated: boolean;
}

/** Thrown when every configured provider fails (or none is configured). */
export class ChatError extends Error {
  readonly attempts: string[];
  constructor(message: string, attempts: string[]) {
    super(message);
    this.name = 'ChatError';
    this.attempts = attempts;
  }
}

const REQUEST_TIMEOUT_MS = 20_000;
export const MAX_TOKENS = 1024;
export const CHAIN_DEADLINE_MS = 25_000;

interface OpenAIChatResponse {
  choices?: Array<{ message?: { content?: string }; finish_reason?: string }>;
}

async function callProvider(
  provider: ProviderConfig,
  messages: ChatMessage[],
  timeoutMs: number,
): Promise<{ content: string; truncated: boolean }> {
  const res = await fetch(`${provider.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      temperature: 0.2,
      max_tokens: MAX_TOKENS,
      stream: false,
    }),
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status} ${detail.slice(0, 200)}`.trim());
  }

  const data = (await res.json()) as OpenAIChatResponse;
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || content.trim() === '') {
    throw new Error('provider returned an empty completion');
  }
  return { content, truncated: data.choices?.[0]?.finish_reason === 'length' };
}

/** Runs the provider chain in order, returning the first successful completion. */
export async function generate(
  messages: ChatMessage[],
  env: Env,
  deadline: number = Date.now() + CHAIN_DEADLINE_MS,
): Promise<GenerateResult> {
  const providers = resolveProviders(env);
  if (providers.length === 0) {
    throw new ChatError('no chat provider is configured', []);
  }

  const attempts: string[] = [];
  for (const provider of providers) {
    const remaining = deadline - Date.now();
    if (remaining <= 0) {
      attempts.push(`${provider.name}: deadline`);
      break;
    }
    try {
      const { content, truncated } = await callProvider(
        provider,
        messages,
        Math.min(REQUEST_TIMEOUT_MS, remaining),
      );
      return { answer: content, provider: provider.name, failovers: attempts.length, truncated };
    } catch (err) {
      attempts.push(`${provider.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  throw new ChatError('all chat providers failed', attempts);
}
