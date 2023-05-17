import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { DiscountCoupon } from '@menno/types';
import { ShopService } from '../../../core/services/shop.service';
import { BasketService } from '../../../core/services/basket.service';

@Component({
  selector: 'discount-coupon-list-page',
  templateUrl: './discount-coupon-list-page.component.html',
  styleUrls: ['./discount-coupon-list-page.component.scss'],
})
export class DiscountCouponListPageComponent {
  coupons: DiscountCoupon[];

  constructor(private http: HttpClient, private shopService: ShopService, public basket: BasketService,) {
    this.http.get<DiscountCoupon[]>(`discountCoupons/app/${this.shopService.shop?.id}`).subscribe((c) => {
      this.coupons = c;
    });
  }
}
