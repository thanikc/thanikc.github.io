import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
  selector: '[appSelectOnFocus]',
  host: {
    '(focus)': 'onFocus($event)',
  },
})
export class SelectOnFocusDirective {
  onFocus(e: FocusEvent): void {
    if (e.currentTarget instanceof HTMLInputElement) {
      e.currentTarget.select();
    }
  }
}
