import { Route } from '@angular/router';
import { MenuListComponent } from './list/list.component';
import { ProductEditComponent } from './product-edit/product-edit.component';
import { dirtyFormDeactivator } from '../core/guards/dirty-form-deactivator.guard';
import { CategoryListComponent } from './category-list/category-list.component';
import { CostListComponent } from './cost-list/cost-list.component';

export const menuRoutes: Route[] = [
  { path: 'list', component: MenuListComponent },
  { path: 'product', component: ProductEditComponent, canDeactivate: [dirtyFormDeactivator] },
  { path: 'categories', component: CategoryListComponent },
  { path: 'costs', component: CostListComponent },
  { path: '', pathMatch: 'full', redirectTo: 'list' },
];
