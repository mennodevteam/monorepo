import { Route } from '@angular/router';
import { MenuListComponent } from './list/list.component';
import { ProductEditComponent } from './product-edit/product-edit.component';

export const menuRoutes: Route[] = [
  { path: 'list', component: MenuListComponent },
  { path: 'product', component: ProductEditComponent },
  { path: '', pathMatch: 'full', redirectTo: 'list' },
];
