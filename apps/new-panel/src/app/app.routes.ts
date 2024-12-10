import { Route } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { authRoutes } from './auth/auth.routes';
import { menuRoutes } from './menu/menu.routes';
import { translateActivator } from './core/guards/translate.guard';
import { shopDataActivator } from './core/guards/shop.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    canActivate: [translateActivator],
    children: [
      {
        path: 'auth',
        children: authRoutes,
      },
      {
        path: '',
        canActivate: [authGuard, shopDataActivator],
        children: [
          { path: 'menu', children: menuRoutes },
          { path: '', redirectTo: 'menu', pathMatch: 'full' },
        ],
      },
    ],
  },
];
