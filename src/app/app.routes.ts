import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Profile Summary',
    loadComponent: () =>
      import('./domains/profile/profile.component').then(m => m.ProfileComponent),
  },
  {
    path: 'calculator',
    title: 'Retirement Calculator',
    // No ads: this is an interactive tool page, not publisher content — serving ads
    // here trips AdSense's "ads on screens without publisher content" policy.
    data: { ads: false },
    loadComponent: () =>
      import('./domains/retirement-calculator/calculator-shell.component').then(
        m => m.CalculatorShellComponent,
      ),
  },
  {
    path: 'privacy-policy',
    title: 'Privacy Policy',
    // Thin legal/informational content is a poor fit for ads (Google's "low
    // value content" policy), same reasoning as the calculator route above.
    data: { ads: false },
    loadComponent: () =>
      import('./domains/privacy/privacy-policy.component').then(m => m.PrivacyPolicyComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
