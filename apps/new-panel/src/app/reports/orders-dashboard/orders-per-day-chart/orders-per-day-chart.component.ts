import { Component, computed, inject, input, signal } from '@angular/core';

import { SHARED } from '../../../shared';
import { MatCardModule } from '@angular/material/card';
import { HttpClient } from '@angular/common/http';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration } from 'chart.js';
import { ShopService } from '../../../shop/shop.service';
import { TranslateService } from '@ngx-translate/core';
Chart.defaults.font.family = 'IRANSans';

@Component({
  selector: 'app-orders-per-day-chart',
  standalone: true,
  imports: [SHARED, MatCardModule, BaseChartDirective],
  templateUrl: './orders-per-day-chart.component.html',
  styleUrl: './orders-per-day-chart.component.scss',
})
export class OrdersPerDayChartComponent {
  private readonly http = inject(HttpClient);
  public readonly shopService = inject(ShopService);
  public readonly t = inject(TranslateService);
  public readonly fromDate = input.required<Date>();
  public readonly toDate = input.required<Date>();

  public chartOptions: ChartConfiguration['options'] = {
    plugins: {
      legend: { display: true },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        ticks: {
          stepSize: 1,
        },
        min: 0,
        title: {
          display: true,
          text: this.t.instant('dashboard.ordersPerDay'),
        },
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        min: 0,
        title: {
          display: true,
          text: this.t.instant('dashboard.totalSales'),
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
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
    const formatter = new Intl.DateTimeFormat('fa-IR', {
      day: 'numeric',
      month: '2-digit',
      year: '2-digit',
    });
    return {
      datasets: [
        {
          data: data.map((x: any) => x.count),
          label: this.t.instant('dashboard.ordersPerDay'),
          borderColor: '#6B9BD2',
          backgroundColor: '#6B9BD2',
          tension: 0.1,
          yAxisID: 'y',
        },
        {
          data: data.map((x: any) => x.totalSales),
          label: this.t.instant('dashboard.totalSales'),
          borderColor: '#8FBC8F',
          backgroundColor: '#8FBC8F',
          tension: 0.1,
          yAxisID: 'y1',
        },
      ],
      labels: data.map((x: any) => formatter.format(new Date(x.date))),
    } as ChartConfiguration['data'];
  });

  query = injectQuery(() => ({
    queryKey: ['ordersPerDay', this.fromDate(), this.toDate()],
    queryFn: () =>
      lastValueFrom(
        this.http.get<any>(`/dashboard/ordersPerDay/${this.fromDate().toISOString()}/${this.toDate().toISOString()}`),
      ),
    enabled: !!this.fromDate() && !!this.toDate(),
  }));
}
