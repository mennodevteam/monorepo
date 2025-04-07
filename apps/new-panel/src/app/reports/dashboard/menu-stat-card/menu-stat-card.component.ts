import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../../shared';
import { MatCardModule } from '@angular/material/card';
import { HttpClient } from '@angular/common/http';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

@Component({
  selector: 'app-menu-stat-card',
  standalone: true,
  imports: [CommonModule, SHARED, MatCardModule],
  templateUrl: './menu-stat-card.component.html',
  styleUrl: './menu-stat-card.component.scss',
})
export class MenuStatCardComponent {
  private readonly http = inject(HttpClient);

  now = signal(new Date());
  from = computed(() => {
    const date = new Date(this.now());
    date.setDate(date.getDate() - 7);
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
