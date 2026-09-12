import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SpeechRecognitionService } from './speech-recognition.service';

class FakeSpeechRecognition {
  lang = '';
  interimResults = true;
  maxAlternatives = 3;
  onresult: ((event: { results: { transcript: string }[][] }) => void) | null = null;
  onerror: ((event: { error: string }) => void) | null = null;
  onend: (() => void) | null = null;
  start = vi.fn();
  stop = vi.fn();
}

describe('SpeechRecognitionService', () => {
  let service: SpeechRecognitionService;
  let instances: FakeSpeechRecognition[];
  let ctor: ReturnType<typeof vi.fn>;

  const win = () => window as unknown as Record<string, unknown>;

  beforeEach(() => {
    instances = [];
    ctor = vi.fn(function () {
      const instance = new FakeSpeechRecognition();
      instances.push(instance);
      return instance;
    });
    win()['SpeechRecognition'] = ctor;
    delete win()['webkitSpeechRecognition'];

    service = TestBed.inject(SpeechRecognitionService);
  });

  afterEach(() => {
    delete win()['SpeechRecognition'];
    delete win()['webkitSpeechRecognition'];
    vi.restoreAllMocks();
  });

  it('reports supported when SpeechRecognition exists', () => {
    expect(service.isSupported()).toBe(true);
  });

  it('reports unsupported when neither constructor exists', () => {
    delete win()['SpeechRecognition'];

    expect(service.isSupported()).toBe(false);
  });

  it('falls back to the webkit-prefixed constructor', () => {
    delete win()['SpeechRecognition'];
    win()['webkitSpeechRecognition'] = ctor;

    expect(service.isSupported()).toBe(true);
  });

  it('starts recognition in English expecting one final result', () => {
    service.start({ onResult: vi.fn(), onEnd: vi.fn(), onError: vi.fn() });

    expect(instances).toHaveLength(1);
    expect(instances[0].lang).toBe('en-US');
    expect(instances[0].interimResults).toBe(false);
    expect(instances[0].start).toHaveBeenCalledTimes(1);
  });

  it('reports the transcript of the first result', () => {
    const onResult = vi.fn();
    service.start({ onResult, onEnd: vi.fn(), onError: vi.fn() });

    instances[0].onresult!({ results: [[{ transcript: 'hello there' }]] });

    expect(onResult).toHaveBeenCalledWith('hello there');
  });

  it('reports errors and end events', () => {
    const onError = vi.fn();
    const onEnd = vi.fn();
    service.start({ onResult: vi.fn(), onEnd, onError });

    instances[0].onerror!({ error: 'no-speech' });
    instances[0].onend!();

    expect(onError).toHaveBeenCalledWith('no-speech');
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('stops the active recognition', () => {
    service.start({ onResult: vi.fn(), onEnd: vi.fn(), onError: vi.fn() });
    service.stop();

    expect(instances[0].stop).toHaveBeenCalledTimes(1);
  });

  it('reports not-supported and never starts one when unavailable', () => {
    delete win()['SpeechRecognition'];
    const onError = vi.fn();

    service.start({ onResult: vi.fn(), onEnd: vi.fn(), onError });

    expect(onError).toHaveBeenCalledWith('not-supported');
    expect(instances).toHaveLength(0);
  });
});
