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
    // Remove indexAxis to make it a vertical bar chart (default)
    plugins: {
      legend: {
        display: false, // Hide legend for bar chart as labels are on the axis
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: 'IRANSans',
          },
          maxRotation: 45, // Rotate labels for better readability
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
        },
        ticks: {
          font: {
            family: 'IRANSans',
          },
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
            backgroundColor: [],
          },
        ],
        labels: [],
      } as ChartConfiguration['data'];

    // Generate colors for bar chart
    const fillColors = this.generateFillColors(data.length);

    return {
      datasets: [
        {
          label: this.t.instant('app.count'),
          data: data.map((x: any) => x.count),
          backgroundColor: fillColors,
          borderWidth: 0,
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
      labels: data.map((x: any) => x.product),
    } as ChartConfiguration['data'];
  });

  private generateFillColors(count: number): string[] {
    const colors = [
      '#6B9BD2', // Soft Blue
      '#8FBC8F', // Soft Green
      '#D2B48C', // Soft Beige
      '#DDA0DD', // Soft Purple
    ];

    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(colors[i % colors.length]);
    }
    return result;
  }

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
