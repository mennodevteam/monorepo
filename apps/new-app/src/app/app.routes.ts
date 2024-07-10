import { Route } from '@angular/router';
import { shopRoutes } from './shop/shop.routes';
import { menuRoutes } from './menu/menu.routes';
import { shopResolver, translateActivator, userResolver } from './core';

export const appRoutes: Route[] = [
  {
    path: '',
    resolve: {
      user: userResolver,
      shop: shopResolver,
    },
    canActivate: [translateActivator],
    children: [
      { path: 'menu', children: menuRoutes },
      { path: '', children: shopRoutes },
    ],
  },
];
