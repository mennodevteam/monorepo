import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { injectQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class VpnCheckService {
  private readonly http = inject(HttpClient);
  private readonly queryClient = inject(QueryClient);
  readonly queryKey = ['vpn'] as const;
  readonly queryFn = () =>
    firstValueFrom(this.http.get<{ country_code: string }>('https://api.ipbase.com/v1/json/'))
      .then((data) => data.country_code !== 'IR')
      .catch(() => false);
  readonly vpnQuery = injectQuery(() => ({
    queryKey: this.queryKey,
    queryFn: this.queryFn,
  }));
  readonly isVpnEnabled = computed(() => this.vpnQuery.data() === true);

  constructor() {
    this.queryClient.prefetchQuery({
      queryKey: this.queryKey,
      queryFn: this.queryFn,
    });
  }
}
