import { Component, computed, inject, input } from '@angular/core';

import { SHARED } from '../../../shared';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-order-funnel-card',
  standalone: true,
  imports: [CommonModule, SHARED, BaseChartDirective, MatCardModule, MatListModule],
  templateUrl: './order-funnel-card.component.html',
  styleUrl: './order-funnel-card.component.scss',
})
export class OrderFunnelCardComponent {
  private readonly http = inject(HttpClient);
  fromDate = input.required<Date>();
  toDate = input.required<Date>();
  public readonly t = inject(TranslateService);

  public chartOptions: ChartConfiguration['options'] = {
    plugins: {
      legend: {
        display: false,
        position: 'bottom',
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const value = context.parsed.x || context.parsed.y;
            const data = context.dataset.data as number[];
            const total = data[0] || 0;
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
            return `${context.label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true,
      },
    },
  };

  chartData = computed(() => {
    const data = this.query.data();
    if (!data)
      return {
        datasets: [
          {
            data: [],
          },
        ],
        labels: [],
      } as ChartConfiguration['data'];

    return {
      datasets: [
        {
          data: [
            data.loadMenu,
            data.addToBasket,
            data.viewCart,
            data.viewCheckout,
            data.selectAddress,
            data.addOrder,
          ],
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
          borderColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
          borderWidth: 1,
        },
      ],
      labels: [
        this.t.instant('dashboard.loadMenu'),
        this.t.instant('dashboard.addToBasket'),
        this.t.instant('dashboard.viewCart'),
        this.t.instant('dashboard.viewCheckout'),
        this.t.instant('dashboard.selectAddress'),
        this.t.instant('dashboard.addOrder'),
      ],
    } as ChartConfiguration['data'];
  });

  query = injectQuery(() => ({
    queryKey: ['orderFunnelDashboard', this.fromDate(), this.toDate()],
    queryFn: () =>
      lastValueFrom(
        this.http.get<any>(
          `/dashboard/orderFunnel/${this.fromDate().toISOString()}/${this.toDate().toISOString()}`,
        ),
      ),
    enabled: !!this.fromDate() && !!this.toDate(),
  }));

  conversionRate = computed(() => {
    const data = this.query.data();
    if (!data || data.totalOrders === 0) return 0;
    return ((data.deliveredOrders / data.totalOrders) * 100).toFixed(1);
  });

  averageOrderValue = computed(() => {
    const data = this.query.data();
    if (!data || data.deliveredOrders === 0) return 0;
    return (data.totalRevenue / data.deliveredOrders).toFixed(0);
  });
}
