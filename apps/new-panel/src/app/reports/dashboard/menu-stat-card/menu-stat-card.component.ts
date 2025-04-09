import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../../shared';
import { MatCardModule } from '@angular/material/card';
import { HttpClient } from '@angular/common/http';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration } from 'chart.js';
Chart.defaults.font.family = 'IRANSans';

@Component({
  selector: 'app-menu-stat-card',
  standalone: true,
  imports: [CommonModule, SHARED, MatCardModule, BaseChartDirective],
  templateUrl: './menu-stat-card.component.html',
  styleUrl: './menu-stat-card.component.scss',
})
export class MenuStatCardComponent {
  private readonly http = inject(HttpClient);

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
        },
      ],
      labels: data.map((x: any) => formatter.format(new Date(x.date))),
    } as ChartConfiguration['data'];
  });

  now = signal(new Date());
  from = computed(() => {
    const date = new Date(this.now());
    date.setDate(date.getDate() - 30);
    return date;
  });

  query = injectQuery(() => ({
    queryKey: ['menuStatDashboard'],
    queryFn: () =>
      lastValueFrom(
        this.http.get<any>(`/dashboard/menuStat/${this.from().toISOString()}/${this.now().toISOString()}`),
      ),
  }));
}
