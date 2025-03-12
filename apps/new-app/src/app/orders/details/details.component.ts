import { Component, computed, OnDestroy } from '@angular/core';
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
  ],
  templateUrl: './details.component.html',
  styleUrl: './details.component.scss',
})
export class DetailsComponent {
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordersService: OrdersService,
  ) {}

  get id() {
    return this.route.snapshot.params['id'];
  }
}
