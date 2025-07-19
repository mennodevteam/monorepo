import { Route } from '@angular/router';
import { authRoutes } from './auth/auth.routes';
import { authGuard } from './guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: 'auth',
    children: authRoutes,
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [],
  },
];
