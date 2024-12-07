import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable } from '@angular/core';
import { Menu } from '@menno/types';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  readonly http = inject(HttpClient);

  private query = injectQuery(() => ({
    queryKey: ['menus'],
    queryFn: () => lastValueFrom(this.http.get<Menu>('/menus')),
  }));

  data = computed(() => {
    return this.query.data();
  });

  categories = computed(() => {
    const data = this.query.data();
    return data?.categories?.filter((item) => !item.deletedAt);
  });
}
