const EMAIL = /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g;
const IBAN = /\b[A-Z]{2}\d{2}(?: ?[A-Z0-9]{4}){2,7}(?: ?[A-Z0-9]{1,3})?\b/g;
const DIGIT_RUN = /(?<![\w+])[+(]?\d[\d ()./-]{6,}\d(?!\w)/g;

const digitCount = (s: string) => s.replace(/\D/g, '').length;

/**
 * Masks emails, IBAN/card-like numbers and phone numbers so they never reach a provider.
 * Deliberately blunt: a false positive only costs the visitor some retrieval quality.
 */
export function redactPii(input: string): { text: string; found: boolean } {
  let found = false;
  const mask = (label: string) => () => {
    found = true;
    return label;
  };
  const text = input
    .replace(EMAIL, mask('[email]'))
    .replace(IBAN, mask('[number]'))
    .replace(DIGIT_RUN, run => {
      const digits = digitCount(run);
      if (digits >= 13 && digits <= 19 && !/^[+(]/.test(run)) return mask('[number]')();
      return digits >= 9 && digits <= 15 ? mask('[phone]')() : run;
    });
  return { text, found };
}
