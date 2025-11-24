import { HttpClient } from '@angular/common/http';
import { effect, Injectable, signal, untracked, inject } from '@angular/core';
import { ShopService } from './shop.service';
import { DiscountCoupon, Member } from '@menno/types';
import { AuthService } from './auth.service';
import { MenuService } from './menu.service';
import { CampaignService } from './campaign.service';

@Injectable({
  providedIn: 'root',
})
export class ClubService {
  private http = inject(HttpClient);
  private shopService = inject(ShopService);
  private auth = inject(AuthService);
  private menu = inject(MenuService);
  private campaign = inject(CampaignService);

  member = signal<Member | undefined>(undefined);
  coupons = signal<DiscountCoupon[]>([]);

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (user?.id) {
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
    const shop = this.shopService.data();
    if (!this.auth.isGuestUser && shop?.club) {
      try {
        return await this.http
          .get<Member>(`clubs/join/${shop.club.id}`, {
            params: this.campaign.params,
          })
          .toPromise();
      } catch (error) {
        // Ignore errors
      }
    }
    return;
  }

  async getMember() {
    const shop = this.shopService.data();
    if (shop?.club) {
      const member = await this.http.get<Member>(`members/club/${shop.club.id}`).toPromise();
      return member;
    }
    return undefined;
  }

  async getCoupons() {
    const coupons = await this.http
      .get<DiscountCoupon[]>(`discountCoupons/app/${this.shopService.data()?.id}`)
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
