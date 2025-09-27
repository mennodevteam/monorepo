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
import { userActionsGuard } from './core/guards/user-actions.guard';
import { UserAction } from '@menno/types';

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
          {
            path: 'reports',
            children: reportRoutes,
            canActivate: [userActionsGuard],
            data: { userActions: [UserAction.Reports] },
          },
          {
            path: 'menu',
            children: menuRoutes,
            canActivate: [userActionsGuard],
            data: { userActions: [UserAction.Menu] },
          },
          {
            path: 'orders',
            children: orderRoutes,
            canActivate: [userActionsGuard],
            data: { userActions: [UserAction.Order] },
          },
          {
            path: 'pricing',
            component: PricingComponent,
            canActivate: [userActionsGuard],
            data: { userActions: [UserAction.Menu] },
          },
          {
            path: 'settings',
            children: settingsRoutes,
            canActivate: [userActionsGuard],
            data: { userActions: [UserAction.Setting] },
          },
          {
            path: 'club',
            children: clubRoutes,
            canActivate: [userActionsGuard],
            data: { userActions: [UserAction.Club] },
          },
          {
            path: 'inventory',
            children: materialsRoutes,
            canActivate: [userActionsGuard],
            data: { userActions: [UserAction.Inventory] },
          },
          {
            path: 'missions',
            children: missionsRoutes,
            canActivate: [userActionsGuard],
            data: { userActions: [UserAction.Marketing] },
          },
          {
            path: 'coupons',
            children: discountCouponsRoutes,
            canActivate: [userActionsGuard],
            data: { userActions: [UserAction.Coupons] },
          },
          {
            path: 'sms',
            children: smsRoutes,
            canActivate: [userActionsGuard],
            data: { userActions: [UserAction.Reports] },
          },
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
