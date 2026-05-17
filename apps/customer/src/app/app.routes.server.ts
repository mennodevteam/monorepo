import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Server },
  { path: 'categories', renderMode: RenderMode.Server },
  { path: 'categories/:categoryId', renderMode: RenderMode.Server },
  { path: 'categories/:categoryId/:id', renderMode: RenderMode.Server },
  { path: 'menu/product/:id', renderMode: RenderMode.Server },
  { path: '**', renderMode: RenderMode.Server },
];
