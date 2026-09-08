import { resolveProviders, type ProviderConfig } from './providers';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GenerateResult {
  answer: string;
  provider: string;
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

interface OpenAIChatResponse {
  choices?: Array<{ message?: { content?: string } }>;
}

async function callProvider(provider: ProviderConfig, messages: ChatMessage[]): Promise<string> {
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
      stream: false,
    }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
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
  return content;
}

/** Runs the provider chain in order, returning the first successful completion. */
export async function generate(messages: ChatMessage[], env: Env): Promise<GenerateResult> {
  const providers = resolveProviders(env);
  if (providers.length === 0) {
    throw new ChatError('no chat provider is configured', []);
  }

  const attempts: string[] = [];
  for (const provider of providers) {
    try {
      const answer = await callProvider(provider, messages);
      return { answer, provider: provider.name };
    } catch (err) {
      attempts.push(`${provider.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  throw new ChatError('all chat providers failed', attempts);
}
