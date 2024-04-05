import { Route } from '@angular/router';
import { ClubComponent } from './club.component';
import { MemberListComponent } from './member-list/member-list.component';
import { DiscountCouponsComponent } from './discount-coupons/discount-coupons.component';
import { DiscountCouponsEditComponent } from './discount-coupons-edit/discount-coupons-edit.component';
import { SmsGroupComponent } from './sms-group/sms-group.component';
import { SmsListComponent } from './sms-group/sms-list/sms-list.component';
import { MissionListComponent } from './mission-list/mission-list.component';
import { MissionEditComponent } from './mission-edit/mission-edit.component';

export const clubRoutes: Route[] = [
  {
    path: '',
    component: ClubComponent,
    children: [
      { path: '', component: MemberListComponent },
      { path: 'discount-coupons', component: DiscountCouponsComponent },
      { path: 'discount-coupons/edit', component: DiscountCouponsEditComponent },
      { path: 'missions', component: MissionListComponent },
      { path: 'missions/edit', component: MissionEditComponent },
      { path: 'sms/group', component: SmsGroupComponent },
      { path: 'sms/group/:id', component: SmsListComponent },
    ],
  },
];
