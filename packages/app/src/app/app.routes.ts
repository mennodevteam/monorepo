import { Route } from '@angular/router';
import { ShopGuard } from './core/guards/shop.guard';
import { TranslateGuard } from './core/guards/translate.guard';
import { AuthGuard } from './core/guards/auth.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    canActivate: [TranslateGuard],
    children: [
      {
        path: '',
        canActivate: [ShopGuard],
        loadChildren: () => import('./pages/ordering/ordering.module').then((m) => m.OrderingModule),
      },
      {
        path: 'orders',
        loadChildren: () => import('./pages/orders/orders.module').then((m) => m.OrdersModule),
      },
      {
        path: 'profile',
        loadChildren: () => import('./pages/profile/profile.module').then((m) => m.ProfileModule),
      },
    ],
  },
];
