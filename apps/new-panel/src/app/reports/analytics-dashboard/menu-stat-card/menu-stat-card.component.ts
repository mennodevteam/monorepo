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
  selector: 'app-menu-stat-card',
  standalone: true,
  imports: [SHARED, MatCardModule, BaseChartDirective],
  templateUrl: './menu-stat-card.component.html',
  styleUrl: './menu-stat-card.component.scss',
})
export class MenuStatCardComponent {
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
    const formatter = new Intl.DateTimeFormat('fa-IR', {
      day: 'numeric',
      month: '2-digit',
      year: '2-digit',
    });
    return {
      datasets: [
        {
          data: data.map((x: any) => x.menuCount),
          label: this.t.instant('dashboard.view'),
          borderColor: '#6B9BD2',
          backgroundColor: '#6B9BD2',
        },
        {
          data: data.map((x: any) => x.memberCount),
          label: this.t.instant('dashboard.joinClub'),
          borderColor: '#8FBC8F',
          backgroundColor: '#8FBC8F',
        },
      ],
      labels: data.map((x: any) => formatter.format(new Date(x.date))),
    } as ChartConfiguration['data'];
  });

  query = injectQuery(() => ({
    queryKey: ['menuStatDashboard', this.fromDate(), this.toDate()],
    queryFn: () =>
      lastValueFrom(
        this.http.get<any>(`/dashboard/menuStat/${this.fromDate().toISOString()}/${this.toDate().toISOString()}`),
      ),
    enabled: !!this.fromDate() && !!this.toDate(),
  }));
}
