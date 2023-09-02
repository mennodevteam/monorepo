import { Component } from '@angular/core';
import { MenuService } from '../../../core/services/menu.service';
import { ShopService } from '../../../core/services/shop.service';
import { HttpClient } from '@angular/common/http';
import { DiscountCoupon, Member, OrderType } from '@menno/types';
import { BasketService } from '../../../core/services/basket.service';
import { ActivatedRoute } from '@angular/router';
import { ClubService } from '../../../core/services/club.service';

@Component({
  selector: 'shop-home',
  templateUrl: './shop-home.component.html',
  styleUrls: ['./shop-home.component.scss'],
})
export class ShopHomeComponent {
  couponCount = 0;
  member: Member;
  loadingMember = false;
  constructor(
    private shopService: ShopService,
    private menuService: MenuService,
    private http: HttpClient,
    private basket: BasketService,
    private route: ActivatedRoute,
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
    const params = this.route.snapshot.queryParams;
    if (this.menuService.type === null) {
      if (params['table']) {
        this.menuService.type = OrderType.DineIn;
        this.basket.details = { ...this.basket.details, table: params['table'] };
      } else if (params['type']) {
        switch (params['type'].toLowerCase()) {
          case 'delivery':
            this.menuService.type = OrderType.Delivery;
            break;
          case 'dinein':
            this.menuService.type = OrderType.DineIn;
            break;
          case 'takeaway':
            this.menuService.type = OrderType.Takeaway;
            break;
        }
      }
    }
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
