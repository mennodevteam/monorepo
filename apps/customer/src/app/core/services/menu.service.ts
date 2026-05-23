import { HttpClient } from '@angular/common/http';
import { Injectable, REQUEST, computed, inject } from '@angular/core';
import { injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { Menu, Product } from '@menno/types';
import { resolveShopUsername } from '../functions';
import { ensureMenuPrepared } from '../utils/prepare-menu';
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

  readonly data = computed(() => this.menuQuery.data());

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
