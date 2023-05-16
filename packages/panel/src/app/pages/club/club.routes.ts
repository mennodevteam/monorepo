import { Route } from '@angular/router';
import { ClubComponent } from './club.component';
import { MemberListComponent } from './member-list/member-list.component';
import { DiscountCouponsComponent } from './discount-coupons/discount-coupons.component';
import { DiscountCouponsEditComponent } from './discount-coupons-edit/discount-coupons-edit.component';

export const clubRoutes: Route[] = [
  {
    path: '',
    component: ClubComponent,
    children: [
      { path: '', component: MemberListComponent },
      { path: 'discount-coupons', component: DiscountCouponsComponent },
      { path: 'discount-coupons/edit', component: DiscountCouponsEditComponent },
    ],
  },
];
