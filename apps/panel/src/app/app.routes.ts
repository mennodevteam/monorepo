import { Route } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { MenuGuard } from './core/guards/menu.guard';
import { ShopGuard } from './core/guards/shop.guard';
import { TranslateGuard } from './core/guards/translate.guard';
import { PagesComponent } from './pages/pages.component';
import { PluginGuard } from './core/guards/plugin.guard';
import { Plugin, UserAction } from '@menno/types';
import { UserActionsGuard } from './core/guards/user-actions.guard';

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
            path: 'dashboard',
            loadChildren: () => import('./pages/dashboard/dashboard.module').then((m) => m.DashboardModule),
          },
          {
            canActivate: [PluginGuard, UserActionsGuard],
            data: { plugins: [Plugin.Menu], userActions: [UserAction.Menu] },
            path: 'menu',
            loadChildren: () => import('./pages/menu/menu.module').then((m) => m.MenuModule),
          },
          {
            canActivate: [PluginGuard, UserActionsGuard],
            data: { plugins: [Plugin.Ordering], userActions: [UserAction.Order] },
            path: 'pos',
            loadChildren: () => import('./pages/pos/pos.module').then((m) => m.PosModule),
          },
          {
            canActivate: [PluginGuard, UserActionsGuard],
            data: { plugins: [Plugin.Ordering], userActions: [UserAction.Order] },
            path: 'orders',
            loadChildren: () => import('./pages/orders/orders.module').then((m) => m.OrdersModule),
          },
          {
            canActivate: [PluginGuard, UserActionsGuard],
            data: { plugins: [Plugin.Club], userActions: [UserAction.Club] },
            path: 'club',
            loadChildren: () => import('./pages/club/club.module').then((m) => m.ClubModule),
          },
          {
            canActivate: [UserActionsGuard],
            data: { userActions: [UserAction.Setting] },
            path: 'settings',
            loadChildren: () => import('./pages/settings/settings.module').then((m) => m.SettingsModule),
          },
          {
            path: '',
            loadChildren: () => import('./pages/home/home.module').then((m) => m.HomeModule),
          },
        ],
      },
    ],
  },
];
