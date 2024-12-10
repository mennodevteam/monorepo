import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Shop } from '@menno/types';
import { TranslateService } from '@ngx-translate/core';
import { injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

const QUERY_KEY = ['shops'];

@Injectable({
  providedIn: 'root',
})
export class ShopService {
  readonly http = inject(HttpClient);
  readonly snack = inject(MatSnackBar);
  readonly t = inject(TranslateService);
  readonly queryClient = injectQueryClient();

  private query = injectQuery(() => ({
    queryKey: QUERY_KEY,
    queryFn: () => lastValueFrom(this.http.get<Shop>('/shops')),
  }));

  data = computed(() => {
    return this.query.data();
  });
}
