import { Injectable } from '@angular/core';

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
    recognition.lang = 'en-US';
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
