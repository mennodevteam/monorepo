import { Route } from '@angular/router';
import { ShopGuard } from './core/guards/shop.guard';

export const appRoutes: Route[] = [
  {
    path: 'admin',
    loadChildren: () =>
      import('./pages/admin/admin.module').then((m) => m.AdminModule),
  },
  {
    path: '',
    canActivate: [ShopGuard],
    loadChildren: () =>
      import('./pages/ordering/ordering.module').then((m) => m.OrderingModule),
  },
];
