import { HttpClient } from '@angular/common/http';
import { Injectable, REQUEST, computed, inject } from '@angular/core';
import { injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { Menu, Product } from '@menno/types';
import { resolveShopUsername } from '../functions';
import { ensureMenuPrepared } from '../utils/prepare-menu';
import { serializeCircularForTransfer } from '../utils/serialize-for-transfer';
import { CampaignService } from './campaign.service';
import { AuthService } from './auth.service';
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

const MENU_QUERY_KEY = (username: string) => ['menu', username] as const;

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private readonly http = inject(HttpClient);
  private readonly queryClient = inject(QueryClient);
  private readonly campaign = inject(CampaignService);
  private readonly auth = inject(AuthService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly request = inject(REQUEST, { optional: true }) as Request | null;
  private loadMenuStatSent = false;

  private get username(): string {
    const host = this.request?.headers?.get('host')?.split(':')[0];
    return resolveShopUsername(
      host ?? (typeof window !== 'undefined' ? window.location.hostname : undefined),
    );
  }

  readonly menuQuery = injectQuery(() => ({
    queryKey: MENU_QUERY_KEY(this.username),
    queryFn: () => this.fetchMenu(this.username),
    refetchOnWindowFocus: false,
    structuralSharing: false,
    select: (data: Menu) => (data ? ensureMenuPrepared(data) : data),
    staleTime: isPlatformServer(this.platformId) ? Number.POSITIVE_INFINITY : 0,
  }));

  prefetchMenu(username: string) {
    return this.queryClient.prefetchQuery({
      queryKey: MENU_QUERY_KEY(username),
      queryFn: () => this.fetchMenu(username),
    });
  }

  readonly data = computed(() => {
    const menu = this.menuQuery.data();
    if (!menu) return undefined;
    const campaign = this.campaign.activeCampaign();
    if (!campaign) return menu;

    const cloned: Menu = serializeCircularForTransfer(menu);
    if (campaign.actions) {
      for (const action of campaign.actions) {
        if (action.type === 'product_discount' || action.type === 'category_discount') {
          const { discountType } = action.payload;
          const discountValue = action.payload.discountValue ?? 0;

          const applyProductDiscount = (prod: any) => {
            if (!prod) return;
            if (!prod.details) prod.details = {};
            if (prod.details.originalPrice === undefined) {
              prod.details.originalPrice = prod.price;
            }
            if (discountType === 'percent') {
              prod.price = Math.max(0, prod.details.originalPrice * (1 - discountValue / 100));
            } else {
              prod.price = Math.max(0, prod.details.originalPrice - discountValue);
            }

            if (prod.variants?.length) {
              for (const v of prod.variants) {
                if (!v.details) v.details = {};
                if (v.details.originalPrice === undefined) {
                  v.details.originalPrice = v.price;
                }
                if (discountType === 'percent') {
                  v.price = Math.max(0, v.details.originalPrice * (1 - discountValue / 100));
                } else {
                  v.price = Math.max(0, v.details.originalPrice - discountValue);
                }
              }
            }
          };

          if (action.type === 'product_discount') {
            const { productId, variantId } = action.payload;
            const product = cloned.categories
              ?.flatMap((c) => c.products || [])
              .find((p) => p.id === productId);
            if (product) {
              if (variantId) {
                const variant = product.variants?.find((v) => v.id === variantId);
                if (variant) {
                  if (!variant.details) variant.details = {};
                  if (variant.details.originalPrice === undefined) {
                    variant.details.originalPrice = variant.price;
                  }
                  if (discountType === 'percent') {
                    variant.price = Math.max(0, variant.details.originalPrice * (1 - discountValue / 100));
                  } else {
                    variant.price = Math.max(0, variant.details.originalPrice - discountValue);
                  }
                }
              } else {
                applyProductDiscount(product);
              }
            }
          } else if (action.type === 'category_discount') {
            const { categoryId } = action.payload;
            const category = cloned.categories?.find((c) => c.id?.toString() === categoryId?.toString());
            if (category && category.products) {
              for (const product of category.products) {
                applyProductDiscount(product);
              }
            }
          }
        }
      }
    }
    Menu.setRefsAndSort(cloned, undefined, false, false);
    return cloned;
  });

  private async fetchMenu(username: string): Promise<Menu> {
    const menu = await firstValueFrom(
      this.http.get<Menu>(`menus/${username}`, {
        headers: { skipJwt: 'true' },
      }),
    );
    if (menu?.id && !this.loadMenuStatSent && isPlatformBrowser(this.platformId)) {
      this.loadMenuStatSent = true;
      await this.auth.getResolver();
      if (!this.auth.user()?.id) {
        return menu;
      }
      this.http
        .get(`menuStats/loadMenu/${menu.id}`, { params: this.campaign.params })
        .subscribe({ error: () => {} });
    }
    return menu;
  }

  getProductById(id: string): Product | null {
    const data = this.data();
    return data ? Menu.getProductById(data, id) : null;
  }
}
