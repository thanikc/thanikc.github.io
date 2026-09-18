import { Color } from 'three';

/**
 * Resolves a `--mat-sys-*` custom property to a real three.js Color, so scene
 * definitions stay token-driven instead of hard-coding a hex that drifts from
 * the palette (see UX-UI.md "Theme tokens are the source of truth"). Reading
 * `getPropertyValue` directly returns the raw cascaded text (Angular Material
 * emits `light-dark(#light, #dark)`), not a resolved colour — a real element,
 * in the document, is needed for the browser to resolve it for the app's
 * `color-scheme: light`. Not unit-tested: jsdom does not resolve `var()` in
 * `getComputedStyle` at all (verified — it returns the token text back
 * unchanged), so this only has meaning in a real browser.
 */
export function readThemeColor(cssVariable: string): Color {
  const probe = document.createElement('span');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.color = `var(${cssVariable})`;
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).color;
  probe.remove();
  return new Color(resolved);
}
