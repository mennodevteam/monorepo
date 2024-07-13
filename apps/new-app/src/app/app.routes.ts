import { Route } from '@angular/router';
import { shopRoutes } from './shop/shop.routes';
import { menuRoutes } from './menu/menu.routes';
import { menuResolver, shopResolver, translateActivator, userResolver } from './core';
import { ShellComponent } from './shell/shell.component';
import { CartComponent } from './cart/cart.component';
import { PaymentComponent } from './payment/payment.component';
import { authRoutes } from './auth/auth.routes';
import { MainMenuComponent } from './main-menu/main-menu.component';

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
      { path: 'main-menu', component: MainMenuComponent },
      { path: 'login', children: authRoutes },
      { path: 'menu', children: menuRoutes },
      { path: 'cart', component: CartComponent },
      { path: 'payment', component: PaymentComponent },
      { path: '', children: shopRoutes },
    ],
  },
];
