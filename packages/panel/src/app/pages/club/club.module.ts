import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MemberListComponent } from './member-list/member-list.component';
import { ClubComponent } from './club.component';
import { SharedModule } from '../../shared/shared.module';
import { RouterModule } from '@angular/router';
import { clubRoutes } from './club.routes';
import { MembersTableComponent } from './member-list/members-table/members-table.component';
import { TagEditDialogComponent } from './member-list/tag-edit-dialog/tag-edit-dialog.component';
import { DiscountCouponsComponent } from './discount-coupons/discount-coupons.component';
import { DiscountCouponsEditComponent } from './discount-coupons-edit/discount-coupons-edit.component';

@NgModule({
  declarations: [
    MemberListComponent,
    ClubComponent,
    TagEditDialogComponent,
    MembersTableComponent,
    DiscountCouponsComponent,
    DiscountCouponsEditComponent,
  ],
  imports: [CommonModule, SharedModule, RouterModule.forChild(clubRoutes)],
})
export class ClubModule {}
