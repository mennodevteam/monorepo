import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { ShopService } from '../../shop/shop.service';
import { lastValueFrom } from 'rxjs';
import { FilterMemberV2Dto, FilterMemberV2ResponseDto } from '@menno/types';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SHARED } from '../../shared';
import { MatCardModule } from '@angular/material/card';
import { MembersTableComponent } from './members-table/members-table.component';
import { MatPaginatorModule } from '@angular/material/paginator';

@Component({
  selector: 'app-member-list',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, SHARED, MatCardModule, MembersTableComponent, MatPaginatorModule],
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
}
