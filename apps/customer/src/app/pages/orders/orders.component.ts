import { Component, inject, ElementRef, viewChild, OnDestroy, effect } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { injectInfiniteQuery } from '@tanstack/angular-query-experimental';
import { Order } from '@menno/types';
import { lastValueFrom } from 'rxjs';

import { ImageLoaderDirective } from '../../shared/directives/image-loader.directive';
import { PdatePipe } from '../../shared/pipes/pdate.pipe';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    RouterModule,
    ImageLoaderDirective,
    PdatePipe,
    DecimalPipe,
  ],
  templateUrl: './orders.component.html',
  styleUrl: './orders.component.scss',
})
export class OrdersComponent {
  http = inject(HttpClient);
  readonly pageSize = 25;

  query = injectInfiniteQuery(() => ({
    queryKey: ['orders'],
    queryFn: ({ pageParam }) =>
      lastValueFrom(
        this.http.get<Order[]>('orders', {
          params: {
            skip: (pageParam as number) * this.pageSize,
          },
        }),
      ),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === this.pageSize ? allPages.length : undefined;
    },
  }));

  loadMoreTrigger = viewChild<ElementRef>('loadMoreTrigger');
  private observer?: IntersectionObserver;

  constructor() {
    this.setupIntersectionObserver();
  }

  private setupIntersectionObserver() {
    if (typeof IntersectionObserver === 'undefined') return;

    this.observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && this.query.hasNextPage() && !this.query.isFetchingNextPage()) {
          this.query.fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    // Effect to start observing when the trigger element is available
    const effectRef = effect(() => {
      const trigger = this.loadMoreTrigger();
      if (trigger) {
        this.observer?.observe(trigger.nativeElement);
      }
    });
  }

  loadMore() {
    this.query.fetchNextPage();
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}
