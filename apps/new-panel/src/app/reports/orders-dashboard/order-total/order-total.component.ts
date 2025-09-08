import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { SHARED } from '../../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-order-total',
  standalone: true,
  imports: [CommonModule, SHARED, MatCardModule, MatListModule],
  templateUrl: './order-total.component.html',
  styleUrl: './order-total.component.scss',
})
export class OrderTotalComponent {
  private readonly http = inject(HttpClient);
  public readonly fromDate = input<Date>();
  public readonly toDate = input<Date>();

  query = injectQuery(() => ({
    queryKey: ['orderTotalDashboard', this.fromDate(), this.toDate()],
    queryFn: () => lastValueFrom(this.http.get<any>('/dashboard/sum/count')),
  }));
}
