import { Route } from '@angular/router';
import { MenuComponent } from './menu.component';
import { ProductDetailsComponent } from './product-details/product-details.component';

export const menuRoutes: Route[] = [
  { path: '', component: MenuComponent },
  { path: 'product/:id', component: ProductDetailsComponent },
];
