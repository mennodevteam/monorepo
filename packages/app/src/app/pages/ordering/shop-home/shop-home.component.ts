import { Component } from '@angular/core';
import { MenuService } from '../../../core/services/menu.service';
import { ShopService } from '../../../core/services/shop.service';
import { HttpClient } from '@angular/common/http';
import { DiscountCoupon } from '@menno/types';
import { BasketService } from '../../../core/services/basket.service';

@Component({
  selector: 'shop-home',
  templateUrl: './shop-home.component.html',
  styleUrls: ['./shop-home.component.scss'],
})
export class ShopHomeComponent {
  couponCount = 0;
  constructor(private shopService: ShopService, private menuService: MenuService, private http: HttpClient, private basket: BasketService) {
    this.http.get<DiscountCoupon[]>(`discountCoupons/app/${this.shopService.shop?.id}`).subscribe((c) => {
      if (c.length) {
        this.couponCount = c.length;
        if (!this.basket.productItems?.length && !this.basket.discountCoupon) this.basket.discountCoupon = c[0];
      }
    });
  }

  get shop() {
    return this.shopService.shop;
  }
}
