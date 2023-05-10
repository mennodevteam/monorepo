import { Route } from '@angular/router';
import { PagesComponent } from './pages/pages.component';
import { AuthGuard } from './core/guards/auth.guard';
import { TranslateGuard } from './core/guards/translate.guard';

export const appRoutes: Route[] = [
  {
    path: 'auth',
    loadChildren: () => import('./auth/auth.module').then((m) => m.AuthModule),
  },
  {
    path: '',
    component: PagesComponent,
    canActivate: [AuthGuard, TranslateGuard],
  },
];
