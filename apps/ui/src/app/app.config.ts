import { ApplicationConfig, isDevMode, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { provideAnalytics } from './shared/analytics/analytics.provider';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { CHAT_API_URL } from './domains/chat/chat.config';

/** `wrangler dev` default port. */
const LOCAL_CHAT_API_URL = 'http://localhost:8787';
const DEPLOYED_CHAT_API_URL = 'https://thanikc-worker.thanikc.workers.dev';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withFetch()),
    provideAnalytics(),
    provideClientHydration(withEventReplay()),
    { provide: CHAT_API_URL, useValue: isDevMode() ? LOCAL_CHAT_API_URL : DEPLOYED_CHAT_API_URL },
  ],
};
