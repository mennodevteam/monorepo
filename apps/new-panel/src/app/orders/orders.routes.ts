import { Route } from '@angular/router';
import { OrderListComponent } from './list/list.component';
import { OrderDetailsComponent } from './details/details.component';

export const orderRoutes: Route[] = [
  { path: 'list', component: OrderListComponent },
  { path: 'details/:id', component: OrderDetailsComponent },
  { path: '', pathMatch: 'full', redirectTo: 'list' },
];
