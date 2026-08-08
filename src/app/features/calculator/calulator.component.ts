import { Component } from '@angular/core';

@Component({
    selector: 'app-calculator',
    standalone: true,
    template: `
    <div class="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
      <h2 class="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Retirement Calculator</h2>
      <p class="text-slate-500 dark:text-slate-400">Ready to accept feature requirements to initiate the next TDD cycle!</p>
    </div>
  `
})
export class CalculatorComponent { }