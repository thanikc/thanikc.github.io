import { Injectable, LOCALE_ID, inject } from '@angular/core';
import { DEFAULT_LOCALE, SupportedLocale, matchLocaleTag } from '../../shared/i18n/locales';

/**
 * The Web Speech API wants a full BCP 47 tag, not a bare language: a recogniser
 * asked for `de` transcribes German speech as if it were English.
 */
const SPEECH_TAGS: Record<SupportedLocale, string> = {
  en: 'en-US',
  de: 'de-DE',
  th: 'th-TH',
};

export interface SpeechRecognitionCallbacks {
  onResult: (transcript: string) => void;
  onEnd: () => void;
  onError: (message: string) => void;
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: { results: { transcript: string }[][] }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function speechRecognitionCtor(): SpeechRecognitionCtor | undefined {
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return win.SpeechRecognition ?? win.webkitSpeechRecognition;
}

/** Thin wrapper around the browser's Web Speech API, kept out of components for testability. */
@Injectable({ providedIn: 'root' })
export class SpeechRecognitionService {
  private readonly speechTag = SPEECH_TAGS[matchLocaleTag(inject(LOCALE_ID)) ?? DEFAULT_LOCALE];

  private recognition: SpeechRecognitionLike | null = null;

  isSupported(): boolean {
    return speechRecognitionCtor() !== undefined;
  }

  start(callbacks: SpeechRecognitionCallbacks): void {
    const Ctor = speechRecognitionCtor();
    if (!Ctor) {
      callbacks.onError('not-supported');
      return;
    }

    const recognition = new Ctor();
    recognition.lang = this.speechTag;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = event => callbacks.onResult(event.results[0]?.[0]?.transcript ?? '');
    recognition.onerror = event => callbacks.onError(event.error);
    recognition.onend = () => callbacks.onEnd();

    this.recognition = recognition;
    recognition.start();
  }

  stop(): void {
    this.recognition?.stop();
  }
}
