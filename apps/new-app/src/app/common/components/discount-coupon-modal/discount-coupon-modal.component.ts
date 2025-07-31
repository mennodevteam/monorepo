import { Component, signal } from '@angular/core';

import { MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { COMMON } from '../..';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CartService, ShopService } from '../../../core';
import { HttpClient } from '@angular/common/http';
import { DiscountCoupon } from '@menno/types';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { AnalyticsService } from '../../../core/services/analytics.service';

@Component({
  selector: 'app-discount-coupon-modal',
  standalone: true,
  imports: [
    MatBottomSheetModule,
    COMMON,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule
],
  templateUrl: './discount-coupon-modal.component.html',
  styleUrl: './discount-coupon-modal.component.scss',
})
export class DiscountCouponModalComponent {
  loading = signal(false);
  form: FormGroup;
  constructor(
    public cart: CartService,
    private http: HttpClient,
    private shopService: ShopService,
    private _bottomSheetRef: MatBottomSheetRef<any>,
    private snack: MatSnackBar,
    private translate: TranslateService,
    private analytics: AnalyticsService,
  ) {
    this.form = new FormGroup({
      code: new FormControl('', Validators.required),
    });
  }

  async submit() {
    if (this.form.valid) {
      this.loading.set(true);
      try {
        const coupon = await this.http
          .get<DiscountCoupon>(
            `discountCoupons/check/${this.shopService.shop.id}/${this.form.get('code')?.value}`,
          )
          .toPromise();
        if (coupon) {
          this.cart.coupon.set(coupon);
          // Track successful discount code application
          this.analytics.trackEvent('discount_code_applied', {
            discountCode: this.form.get('code')?.value,
            discountAmount: coupon.fixedDiscount || coupon.percentageDiscount,
            discountType: coupon.fixedDiscount ? 'fixed' : 'percentage'
          });
          this._bottomSheetRef.dismiss();
        } else {
          // Track failed discount code attempt
          this.analytics.trackEvent('discount_code_failed', {
            discountCode: this.form.get('code')?.value
          });
          this.snack.open(this.translate.instant('discountCouponModal.wrongCodeAlert'), '', { duration: 2000 })
        }
      } finally {
        this.loading.set(false);
      }
    }
  }

  cancel() {
    this._bottomSheetRef.dismiss();
  }
}
