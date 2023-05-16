import { Component } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { DiscountCoupon, Status } from '@menno/types';
import { ClubService } from '../../../core/services/club.service';
import { AlertDialogService } from '../../../core/services/alert-dialog.service';

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

  constructor(private club: ClubService, private alertDialogService: AlertDialogService) {
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

  async changeStatus(coupon: DiscountCoupon, ev: MatSlideToggleChange) {
    let prevStatus = coupon.status;
    let newStatus = prevStatus === Status.Active ? Status.Inactive : Status.Active;
    coupon.status = Status.Pending;
    try {
      await this.club.saveDiscountCoupon({
        id: coupon.id,
        status: newStatus,
      });
      coupon.status = newStatus;
    } catch (error) {
      coupon.status = prevStatus;
    }
  }

  async remove(coupon: DiscountCoupon) {
    if (await this.alertDialogService.removeItem(coupon.title)) {
      await this.club.removeDiscountCoupon(coupon.id);
      this.load();
    }
  }
}
