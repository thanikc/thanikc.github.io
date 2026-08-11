import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'profile', renderMode: RenderMode.Prerender },
  { path: 'calculator', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Prerender },
];
