import { Route } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { authRoutes } from './auth/auth.routes';
import { menuRoutes } from './menu/menu.routes';
import { translateActivator } from './core/guards/translate.guard';
import { shopDataActivator } from './core/guards/shop.guard';
import { orderRoutes } from './orders/orders.routes';
import { settingsRoutes } from './settings/settings.routes';
import { reportRoutes } from './reports/reports.routes';
import { ShellComponent } from './shell/shell.component';
import { menuDataActivator } from './core/guards/menu.guard';
import { HomeComponent } from './home/home.component';

export const appRoutes: Route[] = [
  {
    path: '',
    canActivate: [translateActivator],
    children: [
      {
        path: 'auth',
        children: authRoutes,
      },
      {
        path: '',
        component: ShellComponent,
        canActivate: [authGuard, shopDataActivator, menuDataActivator],
        children: [
          { path: 'home', component: HomeComponent },
          { path: 'reports', children: reportRoutes },
          { path: 'menu', children: menuRoutes },
          { path: 'orders', children: orderRoutes },
          { path: 'settings', children: settingsRoutes },
          { path: '', redirectTo: 'home', pathMatch: 'full' },
        ],
      },
    ],
  },
];
