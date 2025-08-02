import { Route } from '@angular/router';
import { DiscountCouponsListComponent } from './discount-coupons-list.component';
import { DiscountCouponsEditComponent } from './discount-coupons-edit.component';

export const discountCouponsRoutes: Route[] = [
  {
    path: '',
    component: DiscountCouponsListComponent,
  },
  {
    path: 'edit',
    component: DiscountCouponsEditComponent,
  },
]; 