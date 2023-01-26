import { Route } from '@angular/router';
import { ShopGuard } from './core/guards/shop.guard';

export const appRoutes: Route[] = [
  {
    path: '',
    canActivate: [ShopGuard],
    loadChildren: () =>
      import('./pages/ordering/ordering.module').then((m) => m.OrderingModule),
  },
];
