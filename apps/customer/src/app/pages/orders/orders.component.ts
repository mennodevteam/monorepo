import { CommonModule } from '@angular/common';
import { Component, inject, signal, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { Order } from '@menno/types';
import { lastValueFrom } from 'rxjs';

import { ImageLoaderDirective } from '../../shared/directives/image-loader.directive';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    RouterModule,
    ImageLoaderDirective,
  ],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent {
  http = inject(HttpClient);
  page = signal(0);
  readonly pageSize = 25;
  total = signal(0);

  query = injectQuery(() => ({
    queryKey: ['orders', this.page()],
    queryFn: () =>
      lastValueFrom(
        this.http.get<Order[]>('orders', {
          params: {
            skip: this.page() * this.pageSize,
          },
        }),
      ),
  }));

  constructor() {
    effect(() => {
      const data = this.query.data();
      if (data) {
        const currentCount = data.length;
        const fetchedSoFar = this.page() * this.pageSize + currentCount;
        if (currentCount === this.pageSize) {
          this.total.set(Math.max(this.total(), fetchedSoFar + 1));
        } else {
          this.total.set(fetchedSoFar);
        }
      }
    });
  }

  onPageChange(event: PageEvent) {
    this.page.set(event.pageIndex);
  }
}
