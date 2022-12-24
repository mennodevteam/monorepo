import { Route } from '@angular/router';
import { AdminComponent } from './admin.component';
import { CategoryListComponent } from './category-list/category-list.component';
import { ProductEditComponent } from './product-edit/product-edit.component';
import { ProductListComponent } from './product-list/product-list.component';
import { ShopEditComponent } from './shop-edit/shop-edit.component';

export const adminRoutes: Route[] = [
  { path: '', component: AdminComponent },
  { path: 'categories', component: CategoryListComponent },
  { path: 'shop', component: ShopEditComponent },
  { path: ':categoryId/products', component: ProductListComponent },
  { path: 'product/:id', component: ProductEditComponent },
];
