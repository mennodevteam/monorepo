import { Routes } from '@angular/router';
import { MenuPageComponent } from './menu-page/menu-page.component';
import { ProductPageComponent } from './product-page/product-page.component';
import { ShopHomeComponent } from './shop-home/shop-home.component';

export const orderingRoutes: Routes = [
  {
    path: 'menu',
    component: MenuPageComponent,
  },
  {
    path: 'menu/product/:id',
    component: ProductPageComponent,
  },
  {
    path: '',
    component: ShopHomeComponent,
  },
  {
    path: ':code',
    component: ShopHomeComponent,
  },
];
