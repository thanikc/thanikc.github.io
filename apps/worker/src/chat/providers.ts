export interface ProviderConfig {
  name: string;
  baseURL: string;
  model: string;
  apiKey: string;
}

/**
 * Ordered chat providers: Groq is primary, Google AI and OpenRouter are fallbacks.
 * All three speak the OpenAI `/chat/completions` shape. Providers without a
 * configured API key are dropped, so the chain degrades gracefully before any
 * keys are added.
 */
export function resolveProviders(env: Env): ProviderConfig[] {
  const candidates: Array<Omit<ProviderConfig, 'apiKey'> & { apiKey: string | undefined }> = [
    {
      name: 'groq',
      baseURL: 'https://api.groq.com/openai/v1',
      model: env.GROQ_MODEL,
      apiKey: env.GROQ_API_KEY,
    },
    {
      name: 'google',
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai',
      model: env.GOOGLE_MODEL,
      apiKey: env.GOOGLE_AI_API_KEY,
    },
    {
      name: 'openrouter',
      baseURL: 'https://openrouter.ai/api/v1',
      model: env.OPENROUTER_MODEL,
      apiKey: env.OPENROUTER_API_KEY,
    },
  ];

  return candidates.filter(
    (c): c is ProviderConfig => typeof c.apiKey === 'string' && c.apiKey !== '',
  );
}
