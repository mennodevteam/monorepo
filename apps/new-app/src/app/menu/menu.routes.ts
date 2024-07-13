import { Route } from '@angular/router';
import { MenuComponent } from './menu.component';
import { ProductDetailsComponent } from './product-details/product-details.component';

export const menuRoutes: Route[] = [
  { path: '', component: MenuComponent, data: {animation: 'menu'} },
  { path: 'product/:id', component: ProductDetailsComponent, data: {animation: 'productDetails'} },
];
