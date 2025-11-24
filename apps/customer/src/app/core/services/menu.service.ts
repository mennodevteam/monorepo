import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { Menu, Product } from '@menno/types';
import { resolveShopUsername } from '../functions';

const MENU_QUERY_KEY = (username: string) => ['menu', username] as const;

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private readonly http = inject(HttpClient);
  private readonly queryClient = inject(QueryClient);
  private readonly username = resolveShopUsername();

  readonly menuQuery = injectQuery(() => ({
    queryKey: MENU_QUERY_KEY(this.username),
    queryFn: () => this.fetchMenu(this.username),
    refetchOnWindowFocus: false,
    select: (data: Menu) => {
      if (data) {
        Menu.setRefsAndSort(data, undefined, false, false);
      }
      return data;
    },
  }));

  prefetchMenu(username: string) {
    return this.queryClient.prefetchQuery({
      queryKey: MENU_QUERY_KEY(username),
      queryFn: () => this.fetchMenu(username),
    });
  }

  readonly data = computed(() => this.menuQuery.data());

  private fetchMenu(username: string) {
    return firstValueFrom(
      this.http.get<Menu>(`menus/${username}`, {
        headers: { skipJwt: 'true' },
      }),
    );
  }

  getProductById(id: string): Product | null {
    const data = this.data();
    return data ? Menu.getProductById(data, id) : null;
  }
}
