import { describe, expect, it } from 'vitest';
import { redactPii } from '../src/pii';

describe('redactPii', () => {
  it.each([
    ['mail me at jane.doe+x@example.co.uk please', 'mail me at [email] please'],
    ['call +49 170 1234567 now', 'call [phone] now'],
    ['call (0170) 123-4567', 'call [phone]'],
    ['my iban is DE89 3704 0044 0532 0130 00 ok', 'my iban is [number] ok'],
    ['card 4111 1111 1111 1111', 'card [number]'],
    ['card 4111-1111-1111-1111', 'card [number]'],
  ])('redacts %s', (input, expected) => {
    expect(redactPii(input)).toEqual({ text: expected, found: true });
  });

  it.each([
    'What did Thanik build in 2024?',
    'Started on 2026-11-02 and ran 12 months',
    'He has 10 years of experience',
  ])('leaves %s untouched', input => {
    expect(redactPii(input)).toEqual({ text: input, found: false });
  });
});
