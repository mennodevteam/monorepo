import { RedirectCommand, Route, Router } from '@angular/router';
import { shopRoutes } from './shop/shop.routes';
import { miscellaneousRoutes } from './miscellaneous/miscellaneous.routes';
import { menuResolver, shopResolver, ShopService, translateActivator, userResolver } from './core';
import { ShellComponent } from './shell/shell.component';
import { inject } from '@angular/core';
import { HomePage } from '@menno/types';

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
      {
        path: 'chat',
        loadChildren: () => import('./chat/chat.routes').then((m) => m.chatRoutes),
        data: { animation: 'chat' },
      },
      {
        path: 'ai',
        loadChildren: () => import('./ai-chat/ai-chat.routes').then((m) => m.aiChatRoutes),
        data: { animation: 'aiChat' },
      },
      {
        path: 'misc',
        children: miscellaneousRoutes,
      },
      {
        path: '',
        canActivate: [
          async () => {
            const router = inject(Router);
            const shopService = inject(ShopService);
            await shopService.getResolver();

            if (shopService.shop?.appConfig?.homePage !== HomePage.Menu) {
              return new RedirectCommand(router.parseUrl('/shop'), { skipLocationChange: true });
            }
            return true;
          },
        ],
        loadChildren: () => import('./menu/menu.routes').then((m) => m.menuRoutes),
      },
      { path: 'shop', children: shopRoutes },
      { path: 'complete/:id', pathMatch: 'full', redirectTo: 'orders/thanks/:id' },
    ],
  },
];
