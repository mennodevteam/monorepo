import { Route } from '@angular/router';
import { OrderDetailsComponent } from './order-details/order-details.component';
import { OrderListComponent } from './order-list/order-list.component';

export const OrdersRoutes: Route[] = [
  { path: '', component: OrderListComponent },
  { path: 'details/:id', component: OrderDetailsComponent },
];
