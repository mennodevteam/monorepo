import { Route } from '@angular/router';
import { OrderListComponent } from './list/list.component';

export const orderRoutes: Route[] = [
  { path: 'list', component: OrderListComponent },
  { path: '', pathMatch: 'full', redirectTo: 'list' },
];
