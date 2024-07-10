import { Route } from '@angular/router';
import { shopRoutes } from './shop/shop.routes';
import { menuRoutes } from './menu/menu.routes';
import { menuResolver, shopResolver, translateActivator, userResolver } from './core';
import { ShellComponent } from './shell/shell.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: ShellComponent,
    resolve: {
      user: userResolver,
      shop: shopResolver,
      menu: menuResolver,
    },
    canActivate: [translateActivator],
    children: [
      { path: 'menu', children: menuRoutes },
      { path: '', children: shopRoutes },
    ],
  },
];
