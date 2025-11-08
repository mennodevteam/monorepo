import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  {
    path: '',
    loadComponent: () =>
      import('./shell/shell.component').then((m) => m.ShellComponent),
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        loadComponent: () =>
          import('./pages/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./pages/categories/categories.component').then((m) => m.CategoriesComponent),
      },
      {
        path: 'cart',
        loadComponent: () =>
          import('./pages/cart/cart.component').then((m) => m.CartComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/orders/orders.component').then((m) => m.OrdersComponent),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile.component').then((m) => m.ProfileComponent),
      },
    ],
  },
  // Future routes without shell (no bottom navigation)
  // Example structure for pages like auth, pdp, etc:
  // {
  //   path: 'auth',
  //   children: [
  //     {
  //       path: 'login',
  //       loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent)
  //     },
  //     {
  //       path: 'register',
  //       loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent)
  //     }
  //   ]
  // },
  // {
  //   path: 'product/:id',
  //   loadComponent: () => import('./pages/pdp/pdp.component').then(m => m.PdpComponent)
  // },
  // {
  //   path: 'search',
  //   loadComponent: () => import('./pages/search/search.component').then(m => m.SearchComponent)
  // },
];
