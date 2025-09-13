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
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
Chart.defaults.font.family = 'IRANSans';

@Component({
  selector: 'app-top-products-card',
  standalone: true,
  imports: [SHARED, MatCardModule, BaseChartDirective, MatMenuModule, MatButtonModule],
  templateUrl: './top-products-card.component.html',
  styleUrl: './top-products-card.component.scss',
})
export class TopProductsCardComponent {
  private readonly http = inject(HttpClient);
  public readonly shopService = inject(ShopService);
  public readonly t = inject(TranslateService);
  public readonly fromDate = input<Date>();
  public readonly toDate = input<Date>();

  // Pagination state
  public readonly currentPage = signal(1);
  public readonly itemsPerPage = 10;
  public readonly Math = Math; // Make Math available in template

  // Pagination computed properties
  public readonly totalItems = computed(() => this.query.data()?.length || 0);
  public readonly totalPages = computed(() => Math.ceil(this.totalItems() / this.itemsPerPage));
  public readonly paginatedData = computed(() => {
    const data = this.query.data();
    if (!data) return [];

    const startIndex = (this.currentPage() - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return data.slice(startIndex, endIndex);
  });
  public readonly pages = computed(() => {
    const totalPages = this.totalPages();
    if (!totalPages) return [];
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  });

  // Calculate max value from entire dataset for consistent Y-axis scaling
  public readonly maxValue = computed(() => {
    const data = this.query.data();
    if (!data || data.length === 0) return 0;
    return Math.max(...data.map((x: any) => x.count));
  });

  public chartOptions = computed((): ChartConfiguration['options'] => ({
    indexAxis: 'y', // Make it a horizontal bar chart
    plugins: {
      legend: {
        display: false, // Hide legend for bar chart as labels are on the axis
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        max: this.maxValue(), // Use the max value from entire dataset
        grid: {
          display: true,
        },
        ticks: {
          font: {
            family: 'IRANSans',
          },
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            family: 'IRANSans',
          },
          maxRotation: 0, // No rotation needed for horizontal bars
          minRotation: 0,
        },
      },
    },
    responsive: true,
    maintainAspectRatio: false,
  }));

  chartData = computed(() => {
    const data = this.paginatedData();
    if (!data || data.length === 0)
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

  public goToPage(page: number) {
    this.currentPage.set(page);
  }
}
