import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: $localize`:@@seo.siteTitle:Thanik Cheowtirakul — Full-stack engineer`,
    loadComponent: () =>
      import('./domains/profile/profile.component').then(m => m.ProfileComponent),
  },
  {
    path: 'calculator',
    title: $localize`:@@calculator.title:Retirement Calculator`,
    loadComponent: () =>
      import('./domains/retirement-calculator/calculator-shell.component').then(
        m => m.CalculatorShellComponent,
      ),
  },
  {
    path: 'privacy-policy',
    title: $localize`:@@privacy.title:Privacy Policy`,
    loadComponent: () =>
      import('./domains/privacy/privacy-policy.component').then(m => m.PrivacyPolicyComponent),
  },
  {
    path: '**',
    redirectTo: '',
  },
];
