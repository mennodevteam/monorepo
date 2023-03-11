import { Route } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { MenuGuard } from './core/guards/menu.guard';
import { ShopGuard } from './core/guards/shop.guard';
import { TodayOrdersGuard } from './core/guards/today-orders.guard';
import { TranslateGuard } from './core/guards/translate.guard';
import { PagesComponent } from './pages/pages.component';

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
        path: '',
        canActivate: [ShopGuard, MenuGuard],
        children: [
          {
            path: 'menu',
            loadChildren: () => import('./pages/menu/menu.module').then((m) => m.MenuModule),
          },
          {
            path: 'pos',
            loadChildren: () => import('./pages/pos/pos.module').then((m) => m.PosModule),
          },
          {
            path: 'orders',
            loadChildren: () => import('./pages/orders/orders.module').then((m) => m.OrdersModule),
          },
          {
            path: 'settings',
            loadChildren: () => import('./pages/settings/settings.module').then((m) => m.SettingsModule),
          },
          { path: '', redirectTo: 'menu', pathMatch: 'full' },
        ],
      },
    ],
  },
];
