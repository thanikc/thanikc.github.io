import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'profile',
    pathMatch: 'full',
  },
  {
    path: 'profile',
    title: 'Profile Summary',
    loadComponent: () =>
      import('./domains/profile/profile.component').then(m => m.ProfileComponent),
  },
  {
    path: 'calculator',
    title: 'Retirement Calculator',
    loadComponent: () =>
      import('./domains/retirement-calculator/calculator-shell.component').then(
        m => m.CalculatorShellComponent,
      ),
  },
  {
    path: '**',
    redirectTo: 'profile',
  },
];
