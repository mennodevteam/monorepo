import { Route } from '@angular/router';
import { OrderListComponent } from './list/list.component';
import { OrderDetailsComponent } from './details/details.component';
import { NewOrderComponent } from './new/new.component';
import { dirtyFormDeactivator } from '../core/guards/dirty-form-deactivator.guard';

export const orderRoutes: Route[] = [
  { path: 'list', component: OrderListComponent },
  { path: 'new', component: NewOrderComponent, canDeactivate: [dirtyFormDeactivator] },
  { path: 'edit/:id', component: NewOrderComponent, canDeactivate: [dirtyFormDeactivator] },
  { path: 'details/:id', component: OrderDetailsComponent },
  { path: '', pathMatch: 'full', redirectTo: 'list' },
];
