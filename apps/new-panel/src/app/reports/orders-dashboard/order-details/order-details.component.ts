import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { SHARED } from '../../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { ShopService } from '../../../shop/shop.service';

@Component({
  selector: 'app-order-details',
  standalone: true,
  imports: [CommonModule, SHARED, MatCardModule, MatListModule, MatDividerModule],
  templateUrl: './order-details.component.html',
  styleUrl: './order-details.component.scss',
})
export class OrderDetailsComponent {
  private readonly http = inject(HttpClient);
  public readonly shopService = inject(ShopService);
  public readonly fromDate = input<Date>();
  public readonly toDate = input<Date>();

  query = injectQuery(() => ({
    queryKey: ['orderDetailsDashboard', this.fromDate(), this.toDate()],
    queryFn: () =>
      lastValueFrom(
        this.http.get<any>(`/dashboard/orderDetails/${this.fromDate()?.toISOString()}/${this.toDate()?.toISOString()}`),
      ),
    enabled: !!this.fromDate() && !!this.toDate(),
  }));
}
