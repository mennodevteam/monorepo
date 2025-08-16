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
import { clubRoutes } from './club/club.routes';
import { materialsRoutes } from './inventory/materials.routes';
import { PricingComponent } from './pricing/pricing.component';
import { WelcomeSetupComponent } from './welcome-setup/welcome-setup.component';
import { missionsRoutes } from './missions/missions.routes';
import { discountCouponsRoutes } from './discount-coupons/discount-coupons.routes';
import { smsRoutes } from './sms-group/sms.routes';

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
          { path: 'pricing', component: PricingComponent },
          { path: 'settings', children: settingsRoutes },
          { path: 'club', children: clubRoutes },
          { path: 'inventory', children: materialsRoutes },
          { path: 'missions', children: missionsRoutes },
          { path: 'coupons', children: discountCouponsRoutes },
          { path: 'sms', children: smsRoutes },
          { path: '', redirectTo: 'home', pathMatch: 'full' },
        ],
      },
      {
        path: 'welcome',
        component: WelcomeSetupComponent,
        canActivate: [authGuard, shopDataActivator, menuDataActivator],
      },
    ],
  },
];
