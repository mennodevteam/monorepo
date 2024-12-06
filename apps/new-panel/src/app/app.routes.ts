import { Route } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { authRoutes } from './auth/auth.routes';

export const appRoutes: Route[] = [
  {
    path: 'auth',
    children: authRoutes,
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [{ path: '', redirectTo: 'leads', pathMatch: 'full' }],
  },
];
