import { Route } from '@angular/router';
import { MenuListComponent } from './list/list.component';

export const menuRoutes: Route[] = [
  { path: 'list', component: MenuListComponent },
  { path: '', pathMatch: 'full', redirectTo: 'list' },
];
