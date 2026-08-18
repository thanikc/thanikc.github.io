import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';

export type ThemeMode = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'theme-mode';

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'system' || value === 'light' || value === 'dark';
}

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly document = inject(DOCUMENT);

  readonly mode = signal<ThemeMode>(this.readStoredMode());

  constructor() {
    this.applyMode(this.mode());
  }

  setMode(mode: ThemeMode): void {
    this.mode.set(mode);
    this.applyMode(mode);

    if (this.isBrowser) {
      localStorage.setItem(STORAGE_KEY, mode);
    }
  }

  private applyMode(mode: ThemeMode): void {
    if (!this.isBrowser) {
      return;
    }

    if (mode === 'system') {
      this.document.documentElement.removeAttribute('data-theme');
    } else {
      this.document.documentElement.setAttribute('data-theme', mode);
    }
  }

  private readStoredMode(): ThemeMode {
    if (!this.isBrowser) {
      return 'system';
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    return isThemeMode(stored) ? stored : 'system';
  }
}
