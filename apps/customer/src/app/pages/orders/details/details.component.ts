import { Component, computed, inject } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe, DecimalPipe } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrdersService } from '../../../core/services/orders.service';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Chat, ChatType } from '@menno/types';
import { ImageLoaderDirective } from '../../../shared/directives/image-loader.directive';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatBadgeModule,
    MatButtonModule,
    RouterModule,
    DatePipe,
    CurrencyPipe,
    DecimalPipe,
    ImageLoaderDirective,
  ],
  templateUrl: './details.component.html',
  styleUrl: './details.component.scss',
})
export class OrderDetailsComponent {
  private readonly http = inject(HttpClient);
  private readonly ordersService = inject(OrdersService);
  private readonly route = inject(ActivatedRoute);

  shop = computed(() => {
    return this.order()?.shop;
  });

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
    return this.chatQuery.data()?.filter((item) => item.type === ChatType.Receive && !item.seen).length || 0;
  });

  get id() {
    return this.route.snapshot.params['id'];
  }
}

