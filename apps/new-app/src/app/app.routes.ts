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
      { path: 'main-menu', component: MainMenuComponent, data: { animation: 'mainMenu' } },
      { path: 'login', children: authRoutes },
      { path: 'menu', children: menuRoutes, data: { animation: 'menu' } },
      { path: 'orders', children: ordersRoutes, data: { animation: 'orders' } },
      { path: 'address', children: addressRoutes, data: { animation: 'address' } },
      { path: 'cart', component: CartComponent, data: { animation: 'cart' } },
      { path: 'payment', component: PaymentComponent, data: { animation: 'payment' } },
      { path: '', children: shopRoutes },
    ],
  },
];
