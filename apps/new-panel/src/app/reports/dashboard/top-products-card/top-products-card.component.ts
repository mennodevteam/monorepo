import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../../shared';
import { MatCardModule } from '@angular/material/card';
import { HttpClient } from '@angular/common/http';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration } from 'chart.js';
import { ShopService } from '../../../shop/shop.service';
import { TranslateService } from '@ngx-translate/core';
import { MatMenuModule } from '@angular/material/menu';
Chart.defaults.font.family = 'IRANSans';

@Component({
  selector: 'app-top-products-card',
  standalone: true,
  imports: [CommonModule, SHARED, MatCardModule, BaseChartDirective, MatMenuModule],
  templateUrl: './top-products-card.component.html',
  styleUrl: './top-products-card.component.scss',
})
export class TopProductsCardComponent {
  private readonly http = inject(HttpClient);
  public readonly shopService = inject(ShopService);
  public readonly t = inject(TranslateService);
  days = signal(30);

  public chartOptions: ChartConfiguration['options'] = {
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        ticks: {
          stepSize: 1,
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
    return {
      datasets: [
        {
          data: data.map((x: any) => x.count),
        },
      ],
      labels: data.map((x: any) => x.product),
    } as ChartConfiguration['data'];
  });

  now = signal(new Date());
  from = computed(() => {
    const date = new Date(this.now());
    date.setDate(date.getDate() - this.days());
    return date;
  });

  query = injectQuery(() => ({
    queryKey: ['topProductsDashboard', this.days()],
    queryFn: () =>
      lastValueFrom(
        this.http.get<any>(`/dashboard/topProducts/${this.from().toISOString()}/${this.now().toISOString()}`),
      ),
  }));
}
