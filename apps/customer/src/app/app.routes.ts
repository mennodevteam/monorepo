import { Route } from '@angular/router';
import { loginActivator } from './core/guards/login.guard';
import { authRoutes } from './auth/auth.routes';

export const appRoutes: Route[] = [
  {
    path: 'search',
    loadComponent: () => import('./pages/search/search.component').then((m) => m.SearchComponent),
  },
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
        loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
        data: { isRootPage: true },
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./pages/categories/categories.component').then((m) => m.CategoriesComponent),
        data: { isRootPage: true },
      },
      {
        path: 'categories/:categoryId',
        loadComponent: () => import('./pages/category/category.component').then((m) => m.CategoryComponent),
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/orders/orders.component').then((m) => m.OrdersComponent),
        data: { isRootPage: true },
        canActivate: [loginActivator],
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
        data: { isRootPage: true },
        canActivate: [loginActivator],
      },
      {
        path: 'categories/:categoryId/:id',
        loadComponent: () => import('./pages/product/product.component').then((m) => m.ProductComponent),
        data: { hideBottomNav: true },
      },
    ],
  },
];
