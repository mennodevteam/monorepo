import { Route } from '@angular/router';

export const appRoutes: Route[] = [
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
        data: { isRootPage: true, title: 'Categories' },
      },
      {
        path: 'categories/:categoryId',
        loadComponent: () => import('./pages/category/category.component').then((m) => m.CategoryComponent),
      },
      {
        path: 'cart',
        loadComponent: () => import('./pages/cart/cart.component').then((m) => m.CartComponent),
        data: { isRootPage: true },
      },
      {
        path: 'orders',
        loadComponent: () => import('./pages/orders/orders.component').then((m) => m.OrdersComponent),
        data: { isRootPage: true },
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
        data: { isRootPage: true },
      },
      {
        path: 'categories/:categoryId/:id',
        loadComponent: () => import('./pages/product/product.component').then((m) => m.ProductComponent),
      },
    ],
  },
];
