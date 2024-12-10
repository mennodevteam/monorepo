import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { FilterOrderDto, Order } from '@menno/types';
import { TableComponent } from './table/table.component';
import { MatCardModule } from '@angular/material/card';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule, SHARED, MatToolbarModule, TableComponent, MatCardModule, MatPaginatorModule],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class OrderListComponent {
  private readonly http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private queryParams = this.route.snapshot.queryParams;
  currentPage = signal(Number(this.queryParams['page'] || 0));
  currentSize = signal(Number(this.queryParams['size'] || 10));
  filterDto = computed<FilterOrderDto>(() => ({
    take: this.currentSize(),
    skip: this.currentPage() * this.currentSize(),
    withCount: true,
  }));
  query = injectQuery(() => ({
    queryKey: ['orders', this.filterDto()],
    queryFn: () => lastValueFrom(this.http.post<[Order[], number]>('/orders/filter', this.filterDto())),
  }));

  pageSize = computed(() => {
    return this.query.data()?.[1] || 0;
  });

  constructor() {
    effect(() => {
      this.router.navigate([], {
        replaceUrl: true,
        queryParams: {
          page: this.currentPage(),
          size: this.currentSize(),
        },
      });
    });
  }

  pageChange(ev: PageEvent) {
    const { previousPageIndex, pageIndex, pageSize } = ev;
    if (previousPageIndex !== pageIndex) {
      this.currentPage.set(pageIndex);
    } else if (pageSize) {
      this.currentSize.set(pageSize);
    }
  }
}
