import { InjectionToken } from '@angular/core';

/** Base URL of the résumé chatbot worker, without a trailing slash (e.g. `http://localhost:8787`). */
export const CHAT_API_URL = new InjectionToken<string>('CHAT_API_URL');
