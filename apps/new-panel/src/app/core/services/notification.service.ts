import { computed, inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { Order, Chat } from '@menno/types';
@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private readonly http = inject(HttpClient);

  private readonly query = injectQuery(() => ({
    queryKey: ['notifications'],
    queryFn: () => lastValueFrom(this.http.get<{date: Date, order?: Order, chat?: Chat}[]>('/panelNotifications')),
    refetchInterval: 20000,
  }));

  data = computed(() => this.query.data());
}
