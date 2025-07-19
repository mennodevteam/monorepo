import { Route } from '@angular/router';
import { authRoutes } from './auth/auth.routes';
import { authGuard } from './guards/auth.guard';
import { ShopsComponent } from './shops/shops.component';

export const appRoutes: Route[] = [
  {
    path: 'auth',
    children: authRoutes,
  },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      {
        path: 'shops',
        component: ShopsComponent,
      },
    ],
  },
];
