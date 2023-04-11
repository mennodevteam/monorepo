import { Route } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { MenuGuard } from './core/guards/menu.guard';
import { ShopGuard } from './core/guards/shop.guard';
import { TodayOrdersGuard } from './core/guards/today-orders.guard';
import { TranslateGuard } from './core/guards/translate.guard';
import { PagesComponent } from './pages/pages.component';
import { PluginGuard } from './core/guards/plugin.guard';
import { Plugin } from '@menno/types';

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
            canActivate: [PluginGuard],
            data: { plugins: [Plugin.Menu] },
            path: 'menu',
            loadChildren: () => import('./pages/menu/menu.module').then((m) => m.MenuModule),
          },
          {
            canActivate: [PluginGuard],
            data: { plugins: [Plugin.Ordering] },
            path: 'pos',
            loadChildren: () => import('./pages/pos/pos.module').then((m) => m.PosModule),
          },
          {
            canActivate: [PluginGuard],
            data: { plugins: [Plugin.Ordering] },
            path: 'orders',
            loadChildren: () => import('./pages/orders/orders.module').then((m) => m.OrdersModule),
          },
          {
            canActivate: [PluginGuard],
            data: { plugins: [Plugin.Club] },
            path: 'club',
            loadChildren: () => import('./pages/club/club.module').then((m) => m.ClubModule),
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
