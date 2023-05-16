import { Component } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { DiscountCoupon, Status } from '@menno/types';
import { ClubService } from '../../../core/services/club.service';

@Component({
  selector: 'discount-coupons',
  templateUrl: './discount-coupons.component.html',
  styleUrls: ['./discount-coupons.component.scss'],
})
export class DiscountCouponsComponent {
  coupons: DiscountCoupon[];
  loading = false;
  Status = Status;
  displayedColumns = ['title', 'discount', 'status', 'actions'];

  constructor(private club: ClubService) {
    this.load();
  }

  load() {
    this.loading = true;
    this.club.getDiscountCoupons().then((c) => {
      if (c) {
        this.coupons = c;
      }
      this.loading = false;
    });
  }

  changeStatus(coupon: DiscountCoupon, ev: MatSlideToggleChange) {}

  remove(coupon: DiscountCoupon) {}
}
