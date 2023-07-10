import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';
import { MenuGuard } from '../../core/guards/menu.guard';
import { BasketPageComponent } from './basket-page/basket-page.component';
import { MenuPageComponent } from './menu-page/menu-page.component';
import { ProductPageComponent } from './product-page/product-page.component';
import { ShopHomeComponent } from './shop-home/shop-home.component';
import { OrderCompleteComponent } from './order-complete/order-complete.component';
import { DiscountCouponListPageComponent } from './discount-coupon-list-page/discount-coupon-list-page.component';
import { ShopGroupPageComponent } from './shop-group-page/shop-group-page.component';

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
        canActivate: [AuthGuard],
        path: 'g',
        component: ShopGroupPageComponent,
      },
      {
        canActivate: [AuthGuard],
        path: 'basket',
        component: BasketPageComponent,
      },
      {
        canActivate: [AuthGuard],
        path: 'coupons',
        component: DiscountCouponListPageComponent,
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
