import { HttpClient } from '@angular/common/http';
import { effect, Injectable, computed, signal, inject } from '@angular/core';
import { ShopService } from './shop.service';
import { DiscountCoupon, Member } from '@menno/types';
import { AuthService } from './auth.service';
import { MenuService } from './menu.service';
import { CampaignService } from './campaign.service';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';

const COUPONS_QUERY_KEY = (shopId: number | string, userId: string) =>
  ['discountCoupons', shopId, userId] as const;
const EMPTY_COUPONS: DiscountCoupon[] = [];

@Injectable({
  providedIn: 'root',
})
export class ClubService {
  private readonly http = inject(HttpClient);
  private readonly shopService = inject(ShopService);
  private readonly auth = inject(AuthService);
  private readonly menu = inject(MenuService);
  private readonly campaign = inject(CampaignService);

  member = signal<Member | undefined>(undefined);
  readonly couponsQuery = injectQuery(() => {
    const shopId = this.shopService.data()?.id || '';
    const userId = this.auth.user()?.id || '';
    return {
      queryKey: COUPONS_QUERY_KEY(shopId, userId),
      queryFn: () =>
        firstValueFrom(
          this.http.get<DiscountCoupon[]>(`discountCoupons/app/${shopId}`, {
            params: {
              userId,
            },
          }),
        ),
      enabled: !!shopId && !!userId,
      refetchOnWindowFocus: false,
    };
  });
  readonly coupons = computed(() => this.couponsQuery.data() || EMPTY_COUPONS);

  constructor() {
    effect(() => {
      const user = this.auth.user();
      if (user?.id) {
        this.getMember().then((member) => {
          if (member) this.member.set(member);
          else this.join();
        });
      }
    });
  }

  async join() {
    const shop = this.shopService.data();
    if (!this.auth.isGuestUser() && shop?.club) {
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

  get wallet() {
    return this.member()?.wallet;
  }
}
