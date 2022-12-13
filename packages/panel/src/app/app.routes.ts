import { Route } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const appRoutes: Route[] = [
  { path: 'auth', loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule) },
  {
    path: '',
    canActivate: [AuthGuard],
    children: [],
  },
  { path: '', redirectTo: 'home', pathMatch: 'full' },
];
