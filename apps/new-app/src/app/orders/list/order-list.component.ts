import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom, skip } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Order } from '@menno/types';
import { TopAppBarComponent } from '../../common/components/top-app-bar/top-app-bar.component';
import { MatListModule } from '@angular/material/list';
import { COMMON } from '../../common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, TopAppBarComponent, MatListModule, COMMON, MatProgressSpinnerModule],
  templateUrl: './order-list.component.html',
  styleUrl: './order-list.component.scss',
})
export class OrderListComponent {
  private readonly http = inject(HttpClient);

  query = injectQuery(() => ({
    queryKey: ['orders'],
    queryFn: () =>
      lastValueFrom(
        this.http.get<Order[]>(`orders`, {
          params: {
            skip: 0,
          },
        }),
      ),
  }));
}
