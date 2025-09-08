import { Component, computed, inject, input } from '@angular/core';

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
  imports: [SHARED, MatCardModule, BaseChartDirective, MatMenuModule],
  templateUrl: './top-products-card.component.html',
  styleUrl: './top-products-card.component.scss',
})
export class TopProductsCardComponent {
  private readonly http = inject(HttpClient);
  public readonly shopService = inject(ShopService);
  public readonly t = inject(TranslateService);
  public readonly fromDate = input<Date>();
  public readonly toDate = input<Date>();

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

  query = injectQuery(() => ({
    queryKey: ['topProductsDashboard', this.fromDate(), this.toDate()],
    queryFn: () =>
      lastValueFrom(
        this.http.get<any>(
          `/dashboard/topProducts/${this.fromDate()?.toISOString()}/${this.toDate()?.toISOString()}`,
        ),
      ),
    enabled: !!this.fromDate() && !!this.toDate(),
  }));
}
