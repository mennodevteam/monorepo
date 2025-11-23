import { HttpClient } from '@angular/common/http';
import { effect, Injectable, signal, untracked } from '@angular/core';
import { ShopService } from './shop.service';
import { DiscountCoupon, Member } from '@menno/types';
import { AuthService } from './auth.service';
import { MenuService } from './menu.service';
import { CampaignService } from './campaign.service';

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
    private campaign: CampaignService,
  ) {
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
    if (!this.auth.isGuestUser && this.shopService.data()?.club) {
      try {
        return await this.http
          .get<Member>(`clubs/join/${this.shopService.data()!.club!.id}`, {
            params: this.campaign.params,
          })
          .toPromise();
      } catch (error) {}
    }
    return;
  }

  async getMember() {
    if (this.shopService.data()?.club) {
      const member = await this.http
        .get<Member>(`members/club/${this.shopService.data()!.club!.id}`)
        .toPromise();
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
