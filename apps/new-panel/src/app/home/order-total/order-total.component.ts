import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { SHARED } from '../../shared';

@Component({
  selector: 'app-order-total',
  imports: [CommonModule, SHARED, MatCardModule, MatListModule],
  templateUrl: './order-total.component.html',
  styleUrl: './order-total.component.scss',
})
export class OrderTotalComponent {
  private readonly http = inject(HttpClient);

  query = injectQuery(() => ({
    queryKey: ['orderTotalDashboard'],
    queryFn: () => lastValueFrom(this.http.get<any>('/dashboard/sum/count')),
  }));
}
