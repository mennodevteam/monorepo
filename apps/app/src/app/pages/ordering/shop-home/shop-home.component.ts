import { Component } from '@angular/core';
import { ShopService } from '../../../core/services/shop.service';
import { HttpClient } from '@angular/common/http';
import { DiscountCoupon, Member } from '@menno/types';
import { BasketService } from '../../../core/services/basket.service';
import { ClubService } from '../../../core/services/club.service';
import { fadeIn } from '../../../core/animations/fade.animation';

@Component({
  selector: 'shop-home',
  templateUrl: './shop-home.component.html',
  styleUrls: ['./shop-home.component.scss'],
  animations: [fadeIn()],
})
export class ShopHomeComponent {
  couponCount = 0;
  member: Member;
  loadingMember = false;
  constructor(
    private shopService: ShopService,
    private http: HttpClient,
    private basket: BasketService,
    public club: ClubService
  ) {
    this.loadMember();
    this.http.get<DiscountCoupon[]>(`discountCoupons/app/${this.shopService.shop?.id}`).subscribe((c) => {
      if (c.length) {
        this.couponCount = c.length;
        if (!this.basket.productItems?.length && !this.basket.discountCoupon)
          this.basket.discountCoupon = c[0];
      }
    });
  }

  async loadMember() {
    this.loadingMember = true;
    try {
      const member = await this.club.getMember();
      if (member) this.member = member;
    } catch (error) {}
    this.loadingMember = false;
  }

  async join() {
    this.loadingMember = true;
    try {
      const member = await this.club.join();
      if (member) this.member = member;
    } catch (error) {}
    this.loadingMember = false;
  }

  get shop() {
    return this.shopService.shop;
  }
}
