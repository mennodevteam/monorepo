import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { SmsGroup, FilterSmsDto } from '@menno/types';
import { injectInfiniteQuery } from '@tanstack/angular-query-experimental';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SHARED } from '../shared';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-sms-group',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatToolbarModule,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    RouterModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './sms-group.component.html',
  styleUrl: './sms-group.component.scss',
})
export class SmsGroupComponent {
  private readonly http = inject(HttpClient);

  filterDto = signal<FilterSmsDto>({
    take: 25,
    skip: 0,
  });

  displayedColumns = ['message', 'createdAt', 'receptors', 'cost', 'inQueue', 'sent', 'failed'];

  public query = injectInfiniteQuery(() => ({
    queryKey: ['smsGroups', this.filterDto()],
    queryFn: ({ pageParam }) => {
      const dto = { ...this.filterDto(), skip: pageParam };
      return lastValueFrom(this.http.post<[SmsGroup[], number]>('/sms/filter', dto));
    },
    initialPageParam: 0,
    getNextPageParam: (last, pages) => {
      const take = this.filterDto().take || 25;
      return last?.[0]?.length === take ? pages.length * take : null;
    },
    refetchOnMount: false,
  }));

  get smsGroups() {
    try {
      const pages = this.query.data()?.pages;
      return pages ? (pages as [SmsGroup[], number][]).reduce((acc, val) => acc.concat(val[0]), [] as SmsGroup[]) : [];
    } catch (error) {
      return [];
    }
  }

  loadMore() {
    this.query.fetchNextPage();
  }
}
