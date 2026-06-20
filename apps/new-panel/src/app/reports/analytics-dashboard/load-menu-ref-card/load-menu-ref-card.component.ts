import { Component, computed, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SHARED } from '../../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { HttpClient } from '@angular/common/http';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration } from 'chart.js';
import { ShopService } from '../../../shop/shop.service';
import { TranslateService } from '@ngx-translate/core';
import { MatMenuModule } from '@angular/material/menu';
Chart.defaults.font.family = 'Estedad';

@Component({
  selector: 'app-load-menu-ref-card',
  standalone: true,
  imports: [
    SHARED,
    CommonModule,
    MatCardModule,
    MatListModule,
    BaseChartDirective,
    MatMenuModule
  ],
  templateUrl: './load-menu-ref-card.component.html',
  styleUrl: './load-menu-ref-card.component.scss',
})
export class LoadMenuRefCardComponent {
  private readonly http = inject(HttpClient);
  public readonly shopService = inject(ShopService);
  public readonly t = inject(TranslateService);
  public readonly fromDate = input.required<Date>();
  public readonly toDate = input.required<Date>();

  public readonly bgColors = ['#93c5fd', '#fde047', '#c4b5fd', '#fbcfe8', '#5eead4', '#a7f3d0'];
  public readonly borderColors = ['#93c5fd', '#fde047', '#c4b5fd', '#fbcfe8', '#5eead4', '#a7f3d0'];

  public chartOptions: ChartConfiguration['options'] = {
    plugins: {
      legend: {
        display: false,
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
          backgroundColor: this.bgColors.slice(0, data.length),
          borderColor: '#ffffff',
          borderWidth: 2,
        },
      ],
      labels: data.map((x: any) => x.source),
    } as ChartConfiguration['data'];
  });

  query = injectQuery(() => ({
    queryKey: ['loadMenuRefDashboard', this.fromDate(), this.toDate()],
    queryFn: () =>
      lastValueFrom(
        this.http.get<any>(
          `/dashboard/loadMenuRef/${this.fromDate().toISOString()}/${this.toDate().toISOString()}`,
        ),
      ),
    enabled: !!this.fromDate() && !!this.toDate(),
  }));
}
