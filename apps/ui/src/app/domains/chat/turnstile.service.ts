import { Injectable, inject } from '@angular/core';
import { TURNSTILE_SITE_KEY } from './chat.config';

interface TurnstileApi {
  render(
    el: HTMLElement,
    options: {
      sitekey: string;
      execution: 'execute';
      appearance: 'interaction-only';
      callback: (token: string) => void;
      'error-callback': () => void;
    },
  ): string;
  execute(widgetId: string): void;
  reset(widgetId: string): void;
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

const turnstileApi = (): TurnstileApi | undefined =>
  (window as unknown as { turnstile?: TurnstileApi }).turnstile;

/** Cloudflare Turnstile behind an invisible widget: one fresh token per `token()` call. */
@Injectable({ providedIn: 'root' })
export class TurnstileService {
  private readonly siteKey = inject(TURNSTILE_SITE_KEY);
  private script?: Promise<TurnstileApi>;
  private widgetId?: string;
  private waiting?: { resolve: (token: string) => void; reject: (error: Error) => void };

  async token(): Promise<string> {
    const api = await this.load();
    return new Promise<string>((resolve, reject) => {
      this.waiting = { resolve, reject };
      if (this.widgetId === undefined) {
        const host = document.body.appendChild(document.createElement('div'));
        host.hidden = true;
        this.widgetId = api.render(host, {
          sitekey: this.siteKey,
          execution: 'execute',
          appearance: 'interaction-only',
          callback: token => this.waiting?.resolve(token),
          'error-callback': () => this.waiting?.reject(new Error('Turnstile failed')),
        });
      } else {
        api.reset(this.widgetId);
      }
      api.execute(this.widgetId);
    });
  }

  private load(): Promise<TurnstileApi> {
    const ready = turnstileApi();
    if (ready) return Promise.resolve(ready);
    return (this.script ??= new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = SCRIPT_URL;
      el.async = true;
      el.onload = () => resolve(turnstileApi()!);
      el.onerror = () => {
        this.script = undefined;
        reject(new Error('Turnstile script failed to load'));
      };
      document.head.appendChild(el);
    }));
  }
}
