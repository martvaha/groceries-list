import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // The shell route for app-shell prerendering
  { path: 'shell', renderMode: RenderMode.Prerender },

  // All other routes use client-side rendering
  { path: '**', renderMode: RenderMode.Client },
];
