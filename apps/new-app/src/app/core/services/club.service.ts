import { HttpClient } from '@angular/common/http';
import { effect, Injectable, signal, untracked } from '@angular/core';
import { ShopService } from './shop.service';
import { DiscountCoupon, Member } from '@menno/types';
import { AuthService } from './auth.service';
import { MenuService } from './menu.service';

@Injectable({
  providedIn: 'root',
})
export class ClubService {
  member = signal<Member | undefined>(undefined);
  coupons = signal<DiscountCoupon[]>([]);

  constructor(
    private http: HttpClient,
    private shopService: ShopService,
    private auth: AuthService,
    private menu: MenuService,
  ) {
    effect(() => {
      if (this.auth.user()) {
        this.getMember().then((member) => {
          if (member) this.member.set(member);
          else this.join();
        });
        untracked(() => {
          this.getCoupons();
        });
      }
    });
  }

  async join() {
    if (!this.auth.isGuestUser && this.shopService.shop?.club) {
      try {
        return await this.http.get<Member>(`clubs/join/${this.shopService.shop.club.id}`).toPromise();
      } catch (error) {}
    }
    return;
  }

  async getMember() {
    if (this.shopService.shop?.club) {
      const member = await this.http.get<Member>(`members/club/${this.shopService.shop.club.id}`).toPromise();
      if (member) {
        this.menu.star.set(member.star);
      }
      return member;
    }
    return undefined;
  }

  async getCoupons() {
    const coupons = await this.http
      .get<DiscountCoupon[]>(`discountCoupons/app/${this.shopService.shop?.id}`)
      .toPromise();
    if (coupons?.length) {
      this.coupons.set(coupons);
    }
    return coupons;
  }

  get wallet() {
    return this.member()?.wallet;
  }
}
