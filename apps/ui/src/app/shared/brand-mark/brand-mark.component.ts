import { ChangeDetectionStrategy, Component } from '@angular/core';

// Drawn wordmark, not set type: the site loads Manrope via swap, so any <text>
// logo would render in a fallback face until the webfont lands (and never in
// the black weight the mark wants). Paths keep it identical on first paint, at
// every size, and in every locale. Colour is currentColor; size the host by
// width or height and aspect-ratio supplies the other.
@Component({
  selector: 'app-brand-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      aspect-ratio: 426 / 100;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
  template: `
    <svg
      viewBox="0 0 426 100"
      role="img"
      aria-label="thanikc"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M13 8H31V40H44V58H31V100H13V58H0V40H13Z" />
      <path
        d="M54 0H72V100H54ZM98 60H116V100H98ZM54 71A31 31 0 0 1 116 71L98 71A13 13 0 0 0 72 71Z"
      />
      <path
        d="M126 70A30 30 0 1 1 186 70A30 30 0 1 1 126 70ZM144 70A12 12 0 1 0 168 70A12 12 0 1 0 144 70ZM168 40H186V100H168Z"
      />
      <path
        d="M196 71A31 31 0 0 1 258 71L240 71A13 13 0 0 0 214 71ZM196 71H214V100H196ZM240 71H258V100H240Z"
      />
      <path d="M268 40H286V100H268ZM268 4H286V22H268Z" />
      <path d="M296 0H314V100H296ZM314 64L334 40H356L314 82ZM314 70L356 100H322L314 94Z" />
      <path d="M417.2 48.8A30 30 0 1 0 417.2 91.2L404.5 78.5A12 12 0 1 1 404.5 61.5Z" />
    </svg>
  `,
})
export class BrandMarkComponent {}
