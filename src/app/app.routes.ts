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
      import('./features/profile/profile.component').then(m => m.ProfileComponent),
  },
  {
    path: 'calculator',
    title: 'Retirement Calculator',
    loadComponent: () =>
      import('./features/calculator/calculator.component').then(
        m => m.RetirementCalculatorComponent,
      ),
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/ads/ad-banner.component').then(m => m.AdBannerComponent),
    outlet: 'ads',
  },
  {
    path: '**',
    redirectTo: 'profile',
  },
];
