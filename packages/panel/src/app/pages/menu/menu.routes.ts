import { Route } from '@angular/router';
import { MenuPageComponent } from './menu-page/menu-page.component';
import { ProductEditPageComponent } from './product-edit-page/product-edit-page.component';

export const menuRoutes: Route[] = [
  { path: '', component: MenuPageComponent },
  { path: 'product', component: ProductEditPageComponent },
];
