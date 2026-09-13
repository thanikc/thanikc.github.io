import { ApplicationConfig, isDevMode, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';

import { routes } from './app.routes';
import { provideAnalytics } from './shared/analytics/analytics.provider';
import { provideLocaleHead } from './shared/i18n/locale-head.provider';
import {
  provideClientHydration,
  withEventReplay,
  withI18nSupport,
} from '@angular/platform-browser';
import { CHAT_API_URL } from './domains/chat/chat.config';

/** `wrangler dev` default port. */
const LOCAL_CHAT_API_URL = 'http://localhost:8787';
const DEPLOYED_CHAT_API_URL = 'https://thanikc-worker.thanikc.workers.dev';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    // Header nav links are `/#fragment` links; the router only scrolls to them when asked.
    // `scrollPositionRestoration: 'enabled'` scrolls new navigations to the top (e.g. to
    // the privacy policy) while still restoring the prior position on back/forward.
    provideRouter(
      routes,
      withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }),
    ),
    provideHttpClient(withFetch()),
    provideAnalytics(),
    provideLocaleHead(),
    // withI18nSupport: without it, hydration cannot match the translated blocks in the
    // prerendered HTML and destroys and re-renders each one instead — measured as a
    // 0.58 layout shift on the home page at 360px (e2e/design.e2e.ts).
    provideClientHydration(withEventReplay(), withI18nSupport()),
    { provide: CHAT_API_URL, useValue: isDevMode() ? LOCAL_CHAT_API_URL : DEPLOYED_CHAT_API_URL },
  ],
};
