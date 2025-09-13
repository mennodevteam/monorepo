import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { DataLoadingComponent } from '../../../shared/components/data-loading/data-loading.component';
import { lastValueFrom } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';

interface UserStatResponse {
  uniqueUserCount: number;
  retentionCount: number;
}

@Component({
  selector: 'app-user-stat-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatListModule,
    TranslateModule,
    FlexLayoutModule,
    DataLoadingComponent,
    BaseChartDirective,
  ],
  templateUrl: './user-stat-card.component.html',
  styleUrl: './user-stat-card.component.scss',
})
export class UserStatCardComponent {
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
    },
    responsive: false,
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
          data: [data.uniqueUserCount - data.retentionCount, data.retentionCount],
          backgroundColor: ['#6B9BD2', '#8FBC8F'],
        },
      ],
      labels: [this.t.instant('dashboard.newUserCount'), this.t.instant('dashboard.retentionUserCount')],
    } as ChartConfiguration['data'];
  });

  query = injectQuery(() => ({
    queryKey: ['userStatDashboard', this.fromDate(), this.toDate()],
    queryFn: () =>
      lastValueFrom(
        this.http.get<any>(
          `/dashboard/userStat/${this.fromDate().toISOString()}/${this.toDate().toISOString()}`,
        ),
      ),
    enabled: !!this.fromDate() && !!this.toDate(),
  }));

  retentionRate = computed(() => {
    const data = this.query.data();
    if (!data) return 0;
    return ((data.retentionCount / data.uniqueUserCount) * 100).toFixed(0);
  });
}
