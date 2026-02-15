import { Route } from '@angular/router';
import { loginActivator } from './core/guards/login.guard';
import { authRoutes } from './auth/auth.routes';
import { HomeComponent } from './pages/home/home.component';
import { CategoriesComponent } from './pages/categories/categories.component';

export const appRoutes: Route[] = [
  {
    path: 'login',
    children: authRoutes,
  },
  {
    path: 'cart',
    loadComponent: () => import('./pages/cart/cart.component').then((m) => m.CartComponent),
  },
  {
    path: 'payment',
    loadComponent: () => import('./pages/checkout/checkout.component').then((m) => m.CheckoutComponent),
  },
  {
    path: 'orders/thanks/:id',
    loadComponent: () => import('./pages/orders/thanks/thanks.component').then((m) => m.ThanksComponent),
  },
  {
    path: 'chat/order/:id',
    loadComponent: () => import('./pages/chat/chat.component').then((m) => m.ChatComponent),
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./pages/privacy/privacy.component').then((m) => m.PrivacyComponent),
  },
  {
    path: 'addresses',
    loadComponent: () => import('./pages/addresses/addresses.component').then((m) => m.AddressesComponent),
    canActivate: [loginActivator],
  },
  {
    path: 'theme-demo',
    loadComponent: () =>
      import('./shared/components/theme-demo/theme-demo.component').then((m) => m.ThemeDemoComponent),
  },
  {
    path: '',
    loadComponent: () => import('./shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        component: HomeComponent,
        data: { isRootPage: true, preserveScrollOnBack: true },
      },
      {
        path: 'categories',
        component: CategoriesComponent,
        data: { isRootPage: true },
      },
      {
        path: 'categories/:categoryId',
        loadComponent: () => import('./pages/category/category.component').then((m) => m.CategoryComponent),
        data: { preserveScrollOnBack: true },
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/orders/orders.component').then((m) => m.OrdersComponent),
        data: { isRootPage: true },
        canActivate: [loginActivator],
      },
      {
        path: 'orders/:id',
        loadComponent: () => import('./pages/orders/details/details.component').then((m) => m.OrderDetailsComponent),
        data: { title: 'جزئیات سفارش', hideMetaAction: true },
      },
      {
        path: 'main-menu',
        loadComponent: () => import('./pages/main-menu/main-menu.component').then((m) => m.MainMenuComponent),
        data: { isRootPage: true },
      },
      {
        path: 'search',
        loadComponent: () => import('./pages/search/search.component').then((m) => m.SearchComponent),
        data: { isRootPage: true, preserveScrollOnBack: true },
      },
      {
        path: 'categories/:categoryId/:id',
        loadComponent: () => import('./pages/product/product.component').then((m) => m.ProductComponent),
        data: { hideBottomNav: true },
      },
    ],
  },
];
