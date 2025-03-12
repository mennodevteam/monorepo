import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMMON } from '../../common';
import { TopAppBarComponent } from '../../common/components';
import { MatListModule } from '@angular/material/list';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdersService } from '../../core/services/orders.service';
import { AlertBannerComponent } from '../../common/components/alert-banner/alert-banner.component';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { HttpClient } from '@angular/common/http';
import { Chat, ChatType } from '@menno/types';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [
    CommonModule,
    COMMON,
    TopAppBarComponent,
    MatListModule,
    AlertBannerComponent,
    MatProgressSpinnerModule,
    MatBadgeModule,
  ],
  templateUrl: './details.component.html',
  styleUrl: './details.component.scss',
})
export class DetailsComponent {
  private readonly http = inject(HttpClient);
  private readonly ordersService = inject(OrdersService);
  private readonly route = inject(ActivatedRoute);

  shop = computed(() => {
    return this.order()?.shop;
  });
  interval: any;

  orderQuery = injectQuery(() => ({
    queryKey: ['order', this.id],
    queryFn: () => lastValueFrom(this.ordersService.getById(this.id)),
    refetchInterval: 30000,
  }));

  chatQuery = injectQuery(() => ({
    queryKey: ['chat', 'order', this.id],
    queryFn: () => lastValueFrom(this.http.get<Chat[]>(`chat/order/${this.id}`)),
    refetchInterval: 20000,
  }));

  order = computed(() => {
    return this.orderQuery.data();
  });

  notSeenChatCount = computed(() => {
    return this.chatQuery.data()?.filter((item) => item.type === ChatType.Receive && !item.seen).length;
  });

  get id() {
    return this.route.snapshot.params['id'];
  }
}
