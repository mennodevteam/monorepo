import { Component, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SHARED } from '../../../shared';

export interface UtmReportRow {
  campaign: string;
  source: string;
  medium: string;
  visits: number;
  clicks: number;
  cartAdds: number;
  uniqueVisitors: number;
  orderCount: number;
  totalSales: number;
}

@Component({
  selector: 'app-utm-stat-card',
  standalone: true,
  imports: [
    SHARED,
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './utm-stat-card.component.html',
  styleUrl: './utm-stat-card.component.scss',
})
export class UtmStatCardComponent {
  private readonly http = inject(HttpClient);

  public readonly fromDate = input.required<Date>();
  public readonly toDate = input.required<Date>();

  displayedColumns: string[] = [
    'campaign',
    'source',
    'medium',
    'visits',
    'clicks',
    'cartAdds',
    'orders',
    'totalSales',
    'conversionRate',
  ];

  query = injectQuery(() => ({
    queryKey: ['utmReportsDashboard', this.fromDate(), this.toDate()],
    queryFn: () =>
      lastValueFrom(
        this.http.get<UtmReportRow[]>(
          `/dashboard/utmReports/${this.fromDate().toISOString()}/${this.toDate().toISOString()}`,
        ),
      ),
    enabled: !!this.fromDate() && !!this.toDate(),
  }));

  data = computed(() => this.query.data() || []);

  totalVisits = computed(() => this.data().reduce((acc, row) => acc + (row.visits || 0), 0));
  totalOrders = computed(() => this.data().reduce((acc, row) => acc + (row.orderCount || 0), 0));
  totalSales = computed(() => this.data().reduce((acc, row) => acc + (row.totalSales || 0), 0));

  getConversionRate(row: UtmReportRow): string {
    if (!row.visits || row.visits === 0) return '۰٪';
    const rate = (row.orderCount / row.visits) * 100;
    return rate.toFixed(1) + '٪';
  }
}
