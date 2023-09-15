import { Routes } from '@angular/router';
import { ForceMobilePhoneGuard } from '../../core/guards/force-mobile-phone.guard';
import { DiscountCouponListPageComponent } from './discount-coupon-list-page/discount-coupon-list-page.component';
import { ClubComponent } from './club.component';

export const clubRoutes: Routes = [
  {
    path: '',
    canActivate: [ForceMobilePhoneGuard],
    component: ClubComponent,
    children: [
      {
        path: 'coupons',
        component: DiscountCouponListPageComponent,
      },
      {
        path: '',
        redirectTo: 'coupons',
        pathMatch: 'full',
      },
    ],
  },
];
