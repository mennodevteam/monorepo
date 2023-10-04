import { Routes } from '@angular/router';
import { MenuGuard } from '../../core/guards/menu.guard';
import { BasketPageComponent } from './basket-page/basket-page.component';
import { MenuPageComponent } from './menu-page/menu-page.component';
import { ProductPageComponent } from './product-page/product-page.component';
import { ShopHomeComponent } from './shop-home/shop-home.component';
import { OrderCompleteComponent } from './order-complete/order-complete.component';
import { ShopGroupPageComponent } from './shop-group-page/shop-group-page.component';
import { MobilePhoneGuard } from '../../core/guards/mobile-phone.guard';
import { ShopWelcomeComponent } from './shop-welcome/shop-welcome.component';
import { OrderingComponent } from './ordering.component';

export const orderingRoutes: Routes = [
  {
    path: '',
    canActivate: [MenuGuard],
    children: [
      {
        path: '',
        component: OrderingComponent,
      },
      {
        path: 'home',
        component: ShopHomeComponent,
      },
      {
        path: 'welcome',
        component: ShopWelcomeComponent,
      },
      {
        path: 'g',
        component: ShopGroupPageComponent,
      },
      {
        canActivate: [MobilePhoneGuard],
        path: 'basket',
        component: BasketPageComponent,
      },
      {
        path: 'menu',
        component: MenuPageComponent,
      },
      {
        path: 'complete/:orderId',
        component: OrderCompleteComponent,
      },
      {
        path: 'menu/product/:id',
        component: ProductPageComponent,
      },
    ],
  },
];
