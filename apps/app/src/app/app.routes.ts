import { Route } from '@angular/router';
import { ShopGuard } from './core/guards/shop.guard';
import { TranslateGuard } from './core/guards/translate.guard';
import { AuthGuard } from './core/guards/auth.guard';
import { MobilePhoneGuard } from './core/guards/mobile-phone.guard';
import { ForceMobilePhoneGuard } from './core/guards/force-mobile-phone.guard';
import { PagesComponent } from './pages/pages.component';

export const appRoutes: Route[] = [
  {
    path: '',
    component: PagesComponent,
    canActivate: [TranslateGuard, AuthGuard, ShopGuard],
    children: [
      {
        path: '',
        loadChildren: () => import('./pages/ordering/ordering.module').then((m) => m.OrderingModule),
      },
      {
        path: 'orders',
        loadChildren: () => import('./pages/orders/orders.module').then((m) => m.OrdersModule),
      },
      {
        path: 'club',
        loadChildren: () => import('./pages/club/club.module').then((m) => m.ClubModule),
      },
      {
        canActivate: [ForceMobilePhoneGuard],
        path: 'profile',
        loadChildren: () => import('./pages/profile/profile.module').then((m) => m.ProfileModule),
      },
    ],
  },
];
