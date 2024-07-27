import { Component, computed, OnDestroy, signal, WritableSignal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMMON } from '../../common';
import { TopAppBarComponent } from '../../common/components';
import { MatListModule } from '@angular/material/list';
import { Order } from '@menno/types';
import { ActivatedRoute, Router } from '@angular/router';
import { OrdersService } from '../../core/services/orders.service';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [CommonModule, COMMON, TopAppBarComponent, MatListModule],
  templateUrl: './details.component.html',
  styleUrl: './details.component.scss',
})
export class DetailsComponent implements OnDestroy {
  order = signal<Order | undefined>(undefined);
  shop = computed(() => {
    return this.order()?.shop
  })
  interval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordersService: OrdersService,
  ) {
    const orderState = this.router.getCurrentNavigation()?.extras?.state?.['order'];
    if (orderState) this.order.set(orderState);
    else {
      this.load();
    }

    this.interval = setInterval(() => {
      this.load();
    }, 20000);
  }

  async load() {
    const order = await this.ordersService.getById(this.id).toPromise();
    if (order) this.order.set(order);
  }

  get id() {
    return this.route.snapshot.params['id'];
  }

  ngOnDestroy(): void {
    if (this.interval) clearInterval(this.interval);
  }
}
