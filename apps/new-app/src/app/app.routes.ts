import { Route } from '@angular/router';
import { shopRoutes } from './shop/shop.routes';
import { AuthGuard, ShopGuard } from './core';
import { menuRoutes } from './menu/menu.routes';

export const appRoutes: Route[] = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        canActivate: [ShopGuard],
        children: [
          { path: 'menu', children: menuRoutes },
          { path: '', children: shopRoutes },
        ],
      },
    ],
  },
];
