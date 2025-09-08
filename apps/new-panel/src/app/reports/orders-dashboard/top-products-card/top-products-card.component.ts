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
      legend: { 
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
        }
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
    
    // Generate colors for pie chart segments
    const colors = this.generateColors(data.length);
    
    return {
      datasets: [
        {
          data: data.map((x: any) => x.count),
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
      labels: data.map((x: any) => x.product),
    } as ChartConfiguration['data'];
  });

  private generateColors(count: number): string[] {
    const colors = [
      '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
      '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF6384'
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
