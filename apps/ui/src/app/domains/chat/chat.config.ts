import { InjectionToken } from '@angular/core';

/** Base URL of the AI Ling worker, without a trailing slash (e.g. `http://localhost:8787`). */
export const CHAT_API_URL = new InjectionToken<string>('CHAT_API_URL');

/** Public Cloudflare Turnstile site key; the worker holds the matching secret. */
export const TURNSTILE_SITE_KEY = new InjectionToken<string>('TURNSTILE_SITE_KEY');
