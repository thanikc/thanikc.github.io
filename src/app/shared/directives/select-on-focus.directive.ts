import { Directive } from '@angular/core';

/** Selects the whole value when a text/number input gains focus, so typing replaces it. */
@Directive({
  selector: '[appSelectOnFocus]',
  host: {
    '(focus)': 'onFocus($event)',
  },
})
export class SelectOnFocusDirective {
  onFocus(event: FocusEvent): void {
    if (event.currentTarget instanceof HTMLInputElement) {
      event.currentTarget.select();
    }
  }
}
