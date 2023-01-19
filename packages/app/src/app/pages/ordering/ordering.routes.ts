import { Routes } from '@angular/router';
import { MenuGuard } from '../../core/guards/menu.guard';
import { ShopService } from '../../core/services/shop.service';
import { BasketPageComponent } from './basket-page/basket-page.component';
import { MenuPageComponent } from './menu-page/menu-page.component';
import { ProductPageComponent } from './product-page/product-page.component';
import { ShopHomeComponent } from './shop-home/shop-home.component';

export const orderingRoutes: Routes = [
  {
    path: '',
    canActivate: [MenuGuard],
    children: [
      {
        path: '',
        component: ShopHomeComponent,
      },
      {
        path: 'basket',
        component: BasketPageComponent,
      },
      {
        path: 'menu',
        component: MenuPageComponent,
      },
      {
        path: 'menu/product/:id',
        component: ProductPageComponent,
      },
    ],
  },
];
