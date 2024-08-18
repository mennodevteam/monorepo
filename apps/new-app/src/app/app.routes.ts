import { Route } from '@angular/router';
import { shopRoutes } from './shop/shop.routes';
import { menuRoutes } from './menu/menu.routes';
import { menuResolver, shopResolver, translateActivator, userResolver } from './core';
import { ShellComponent } from './shell/shell.component';
import { CartComponent } from './cart/cart.component';
import { PaymentComponent } from './payment/payment.component';
import { authRoutes } from './auth/auth.routes';
import { MainMenuComponent } from './main-menu/main-menu.component';
import { ordersRoutes } from './orders/orders.routes';
import { addressRoutes } from './address/address.routes';

export const appRoutes: Route[] = [
  {
    path: '',
    component: ShellComponent,
    resolve: {
      user: userResolver,
      shop: shopResolver,
      menu: menuResolver,
    },
    canActivate: [translateActivator],
    children: [
      {
        path: 'main-menu',
        loadComponent: () => import('./main-menu/main-menu.component').then((m) => m.MainMenuComponent),
        data: { animation: 'mainMenu' },
      },
      { path: 'login', loadChildren: () => import('./auth/auth.routes').then((m) => m.authRoutes) },
      {
        path: 'menu',
        loadChildren: () => import('./menu/menu.routes').then((m) => m.menuRoutes),
        data: { animation: 'menu' },
      },
      {
        path: 'orders',
        loadChildren: () => import('./orders/orders.routes').then((m) => m.ordersRoutes),
        data: { animation: 'orders' },
      },
      {
        path: 'address',
        loadChildren: () => import('./address/address.routes').then((m) => m.addressRoutes),
        data: { animation: 'address' },
      },
      {
        path: 'cart',
        loadComponent: () => import('./cart/cart.component').then((m) => m.CartComponent),
        data: { animation: 'cart' },
      },
      {
        path: 'payment',
        loadComponent: () => import('./payment/payment.component').then((m) => m.PaymentComponent),
        data: { animation: 'payment' },
      },
      { path: '', children: shopRoutes },
      { path: 'complete/:id', pathMatch: 'full', redirectTo: 'orders/thanks/:id' },
    ],
  },
];
