import { HttpClient } from '@angular/common/http';
import { Injectable, REQUEST, computed, inject } from '@angular/core';
import { injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';
import { HomeSection } from '@menno/types';
import { resolveShopUsername } from '../functions';

const HOME_SECTIONS_QUERY_KEY = (username: string) => ['homeSections', username] as const;

@Injectable({
  providedIn: 'root',
})
export class HomeSectionService {
  private readonly http = inject(HttpClient);
  private readonly queryClient = inject(QueryClient);
  private readonly request = inject(REQUEST, { optional: true }) as Request | null;

  private get username(): string {
    const host = this.request?.headers?.get('host')?.split(':')[0];
    return resolveShopUsername(
      host ?? (typeof window !== 'undefined' ? window.location.hostname : undefined),
    );
  }

  readonly homeSectionsQuery = injectQuery(() => ({
    queryKey: HOME_SECTIONS_QUERY_KEY(this.username),
    queryFn: () => this.fetchHomeSections(this.username),
    refetchOnWindowFocus: false,
  }));

  readonly data = computed(() => this.homeSectionsQuery.data() || []);

  private fetchHomeSections(username: string) {
    return firstValueFrom(
      this.http.get<HomeSection[]>(`home-sections/${username}`, {
        headers: { skipJwt: 'true' },
      }),
    );
  }

  prefetchHomeSections(username: string) {
    return this.queryClient.prefetchQuery({
      queryKey: HOME_SECTIONS_QUERY_KEY(username),
      queryFn: () => this.fetchHomeSections(username),
    });
  }
}

