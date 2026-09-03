import { Component, computed, inject } from '@angular/core';

import { COMMON } from '../../common';
import { TopAppBarComponent } from '../../common/components';
import { MatListModule } from '@angular/material/list';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdersService } from '../../core/services/orders.service';
import { AlertBannerComponent } from '../../common/components/alert-banner/alert-banner.component';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { OrderState } from '@menno/types';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [
    COMMON,
    TopAppBarComponent,
    MatListModule,
    AlertBannerComponent,
    MatProgressSpinnerModule,
  ],
  templateUrl: './details.component.html',
  styleUrl: './details.component.scss',
})
export class DetailsComponent {
  private readonly ordersService = inject(OrdersService);
  private readonly route = inject(ActivatedRoute);

  readonly OrderState = OrderState;
  shop = computed(() => {
    return this.order()?.shop;
  });
  interval: any;

  orderQuery = injectQuery(() => ({
    queryKey: ['order', this.id],
    queryFn: () => lastValueFrom(this.ordersService.getById(this.id)),
    refetchInterval: 30000,
  }));

  order = computed(() => {
    return this.orderQuery.data();
  });

  get id() {
    return this.route.snapshot.params['id'];
  }
}
