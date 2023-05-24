import { Route } from '@angular/router';
import { PagesComponent } from './pages/pages.component';
import { AuthGuard } from './core/guards/auth.guard';
import { TranslateGuard } from './core/guards/translate.guard';
import { ShopGuard } from './core/guards/shop.guard';

export const appRoutes: Route[] = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: '',
    component: PagesComponent,
    canActivate: [AuthGuard, TranslateGuard],
    children: [
      {
        canActivate: [ShopGuard],
        path: 'shops',
        loadChildren: () => import('./pages/shops/shops.module').then((m) => m.ShopsModule),
      },
      {
        path: '',
        redirectTo: 'shops',
        pathMatch: 'full',
      },
    ],
  },
];
