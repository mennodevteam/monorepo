import { Route } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { ShopGuard } from './core/guards/shop.guard';
import { PagesComponent } from './pages/pages.component';

export const appRoutes: Route[] = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: '',
    component: PagesComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        canActivate: [ShopGuard],
        children: [
          
        ]
      }
    ],
  },
];
