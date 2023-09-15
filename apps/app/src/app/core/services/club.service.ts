import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ShopService } from './shop.service';
import { DiscountCoupon, Member } from '@menno/types';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root',
})
export class ClubService {
  member?: Member;
  coupons?: DiscountCoupon[];
  constructor(private http: HttpClient, private shopService: ShopService, private auth: AuthService) {
    this.getMember().then((member) => {
      if (member) this.member = member;
    });
    this.getCoupons();
  }

  async join() {
    if (this.auth.isGuestUser) {
      const u = await this.auth.openLoginPrompt();
      if (!u) return;
    }
    if (this.shopService.shop?.club) {
      try {
        return await this.http.get<Member>(`clubs/join/${this.shopService.shop.club.id}`).toPromise();
      } catch (error) {}
    }
    return;
  }

  async getMember() {
    if (this.shopService.shop?.club) {
      return this.http.get<Member>(`members/club/${this.shopService.shop.club.id}`).toPromise();
    }
    return undefined;
  }

  async getCoupons() {
    const coupons = await this.http
      .get<DiscountCoupon[]>(`discountCoupons/app/${this.shopService.shop?.id}`)
      .toPromise();
    if (coupons?.length) {
      this.coupons = coupons;
    }
    return coupons;
  }
}
