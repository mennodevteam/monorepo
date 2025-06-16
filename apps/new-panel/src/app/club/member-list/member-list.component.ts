import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { FilterMemberV2Dto, FilterMemberV2ResponseDto } from '@menno/types';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SHARED } from '../../shared';
import { MatCardModule } from '@angular/material/card';
import { MembersTableComponent } from './members-table/members-table.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';

@Component({
  selector: 'app-member-list',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, SHARED, MatCardModule, MembersTableComponent, MatPaginatorModule, MatSortModule],
  templateUrl: './member-list.component.html',
  styleUrl: './member-list.component.scss',
})
export class MemberListComponent {
  private readonly http = inject(HttpClient);
  filterDto = signal<FilterMemberV2Dto>({
    sortBy: 'joinedAt',
    sortType: 'DESC',
    take: 25,
    skip: 0,
  });

  public query = injectQuery(() => ({
    queryKey: ['memberList', this.filterDto()],
    queryFn: () =>
      lastValueFrom(
        this.http.post<{ data: FilterMemberV2ResponseDto[]; totalCount: number }>(
          '/members/filter-v2',
          this.filterDto(),
        ),
      ),
  }));

  onPageChange(event: { pageIndex: number; pageSize: number }) {
    this.filterDto.update((dto) => ({
      ...dto,
      take: event.pageSize,
      skip: event.pageIndex * event.pageSize,
    }));
  }

  async downloadCsv() {
    // Fetch all data (no pagination)
    const filter = { ...this.filterDto(), skip: 0, take: 1000000 };
    const response = await lastValueFrom(
      this.http.post<{ data: any[]; totalCount: number }>('/members/filter-v2', filter),
    );
    const rows = response.data;
    if (!rows.length) return;
    // Prepare CSV header and rows
    const header = [
      'نام',
      'موبایل',
      'تاریخ عضویت',
      'اولین خرید',
      'آخرین خرید',
      'تعداد خرید',
      'جمع خرید',
      'آخرین بازدید',
    ];
    const csvRows = rows.map((row) => [
      row.member?.user?.firstName + ' ' + row.member?.user?.lastName,
      row.member?.user?.mobilePhone,
      row.joinedAt ? new Date(row.joinedAt).toDateString() : '',
      row.firstOrderTime ? new Date(row.firstOrderTime).toDateString() : '',
      row.lastOrderTime ? new Date(row.lastOrderTime).toDateString() : '',
      row.totalOrderCount,
      row.totalOrderSum,
      row.lastVisitDate ? new Date(row.lastVisitDate).toDateString() : '',
    ]);
    // CSV string with BOM for UTF-8
    const csvContent =
      '\uFEFF' + [header, ...csvRows].map((e) => e.map((x) => '"' + (x ?? '') + '"').join(',')).join('\n');
    // Native download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'members.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  onSortChange(event: { sortBy: string; sortType: 'ASC' | 'DESC' }) {
    this.filterDto.update((dto) => ({
      ...dto,
      sortBy: event.sortBy as FilterMemberV2Dto['sortBy'],
      sortType: event.sortType,
      skip: 0, // reset to first page on sort
    }));
  }
}
