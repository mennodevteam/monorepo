import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiscountCouponListPageComponent } from './discount-coupon-list-page/discount-coupon-list-page.component';
import { RouterModule } from '@angular/router';
import { clubRoutes } from './club.routes';
import { SharedModule } from '../../shared/shared.module';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { ClubComponent } from './club.component';

@NgModule({
  declarations: [DiscountCouponListPageComponent, ClubComponent],
  imports: [
    CommonModule,
    SharedModule,
    RouterModule.forChild(clubRoutes),
    MatCardModule,
    MatToolbarModule,
    MatButtonModule,
    MatListModule,
  ],
})
export class ClubModule {}
