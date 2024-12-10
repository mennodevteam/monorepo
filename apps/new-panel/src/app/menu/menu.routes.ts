import { Route } from '@angular/router';
import { MenuListComponent } from './list/list.component';
import { ProductEditComponent } from './product-edit/product-edit.component';
import { dirtyFormDeactivator } from '../core/guards/dirty-form-deactivator.guard';

export const menuRoutes: Route[] = [
  { path: 'list', component: MenuListComponent },
  { path: 'product', component: ProductEditComponent, canDeactivate: [dirtyFormDeactivator] },
  { path: '', pathMatch: 'full', redirectTo: 'list' },
];
