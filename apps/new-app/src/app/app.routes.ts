import { Route } from '@angular/router';
import { shopRoutes } from './shop/shop.routes';
import { AuthGuard, ShopGuard, TranslateGuard } from './core';

export const appRoutes: Route[] = [
  {
    path: '',
    canActivate: [AuthGuard],
    children: [{ path: '', canActivate: [ShopGuard], children: shopRoutes }],
  },
];
