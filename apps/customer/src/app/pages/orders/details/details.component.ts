import { Component, computed, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { OrdersService } from '../../../core/services/orders.service';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Chat, ChatType, OrderState } from '@menno/types';
import { ImageLoaderDirective } from '../../../shared/directives/image-loader.directive';
import { OrderStatePipe } from '../../../shared/pipes/order-state.pipe';
import { PdatePipe } from '../../../shared/pipes/pdate.pipe';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  saxTimerOutline,
  saxCommandOutline,
  saxTruckFastOutline,
  saxTickCircleOutline,
  saxVerifyOutline,
  saxCloseCircleOutline,
  saxMessage2Outline,
} from '@ng-icons/iconsax/outline';

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
    MatDividerModule,
    RouterModule,
    DecimalPipe,
    ImageLoaderDirective,
    OrderStatePipe,
    PdatePipe,
    NgIcon,
  ],
  providers: [
    provideIcons({
      saxTimerOutline,
      saxCommandOutline,
      saxTruckFastOutline,
      saxTickCircleOutline,
      saxVerifyOutline,
      saxCloseCircleOutline,
      saxMessage2Outline,
    }),
  ],
  templateUrl: './details.component.html',
  styleUrl: './details.component.scss',
})
export class OrderDetailsComponent {
  private readonly http = inject(HttpClient);
  private readonly ordersService = inject(OrdersService);
  private readonly route = inject(ActivatedRoute);

  OrderState = OrderState;

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

  get stateDescription() {
    const state = this.order()?.state;
    switch (state) {
      case OrderState.Pending:
        return 'سفارش شما ثبت شده و منتظر تایید توسط فروشگاه است.';
      case OrderState.Processing:
        return 'فروشگاه در حال آماده‌سازی سفارش شماست.';
      case OrderState.Ready:
        return 'سفارش شما آماده است و می‌توانید آن را تحویل بگیرید.';
      case OrderState.Shipping:
        return 'پیک در حال حمل سفارش شما به مقصد است.';
      case OrderState.Completed:
        return 'این سفارش با موفقیت به پایان رسیده است.';
      case OrderState.Canceled:
        return 'این سفارش لغو شده است.';
      default:
        return '';
    }
  }

  get stateIcon() {
    const state = this.order()?.state;
    switch (state) {
      case OrderState.Pending:
        return 'saxTimerOutline';
      case OrderState.Processing:
        return 'saxCommandOutline';
      case OrderState.Ready:
        return 'saxTickCircleOutline';
      case OrderState.Shipping:
        return 'saxTruckFastOutline';
      case OrderState.Completed:
        return 'saxVerifyOutline';
      case OrderState.Canceled:
        return 'saxCloseCircleOutline';
      default:
        return 'saxTimerOutline';
    }
  }
}
