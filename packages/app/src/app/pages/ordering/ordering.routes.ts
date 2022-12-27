import { Routes } from '@angular/router';
import { MenuGuard } from '../../core/guards/menu.guard';
import { ShopService } from '../../core/services/shop.service';
import { MenuPageComponent } from './menu-page/menu-page.component';
import { ProductPageComponent } from './product-page/product-page.component';
import { ShopHomeComponent } from './shop-home/shop-home.component';

export const orderingRoutes: Routes = [
  {
    path: '',
    children: [
      {
        path: '',
        component: ShopHomeComponent,
      },
      {
        path: 'menu',
        canActivate: [MenuGuard],
        component: MenuPageComponent,
      },
      {
        path: 'menu/product/:id',
        canActivate: [MenuGuard],
        component: ProductPageComponent,
      },
    ],
  },
];
