import { Component, inject, signal } from '@angular/core';
import { MatBottomSheetModule, MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpClient } from '@angular/common/http';
import { DiscountCoupon } from '@menno/types';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CartService } from '../../../core/services/cart.service';
import { ShopService } from '../../../core/services/shop.service';
import { AnalyticsService } from '../../../core/services/analytics.service';

@Component({
  selector: 'app-discount-coupon-modal',
  standalone: true,
  imports: [
    MatBottomSheetModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './discount-coupon-modal.component.html',
  styleUrl: './discount-coupon-modal.component.scss',
})
export class DiscountCouponModalComponent {
  private http = inject(HttpClient);
  private shopService = inject(ShopService);
  private bottomSheetRef = inject(MatBottomSheetRef<DiscountCouponModalComponent>);
  private snack = inject(MatSnackBar);
  private analytics = inject(AnalyticsService);
  cart = inject(CartService);

  loading = signal(false);
  form = new FormGroup({
    code: new FormControl('', Validators.required),
  });

  async submit() {
    if (this.form.valid) {
      this.loading.set(true);
      try {
        const shop = this.shopService.data();
        if (!shop?.id) {
          this.snack.open('خطا در دریافت اطلاعات فروشگاه', '', { duration: 2000 });
          return;
        }

        const coupon = await this.http
          .get<DiscountCoupon>(`discountCoupons/check/${shop.id}/${this.form.get('code')?.value}`)
          .toPromise();

        if (coupon) {
          this.cart.coupon.set(coupon);
          this.analytics.trackEvent('discount_code_applied', {
            discountCode: this.form.get('code')?.value,
            discountAmount: coupon.fixedDiscount || coupon.percentageDiscount,
            discountType: coupon.fixedDiscount ? 'fixed' : 'percentage',
          });
          this.bottomSheetRef.dismiss();
        } else {
          this.analytics.trackEvent('discount_code_failed', {
            discountCode: this.form.get('code')?.value,
          });
          this.snack.open('کد تخفیف معتبر نیست', '', { duration: 2000 });
        }
      } catch (error) {
        this.snack.open('خطا در بررسی کد تخفیف', '', { duration: 2000 });
      } finally {
        this.loading.set(false);
      }
    }
  }

  cancel() {
    this.bottomSheetRef.dismiss();
  }
}

