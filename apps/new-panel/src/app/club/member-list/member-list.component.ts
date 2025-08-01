import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Chat, FilterMemberV2Dto, FilterMemberV2ResponseDto, Member } from '@menno/types';
import { injectMutation, injectQuery } from '@tanstack/angular-query-experimental';
import { MatToolbarModule } from '@angular/material/toolbar';
import { SHARED } from '../../shared';
import { MatCardModule } from '@angular/material/card';
import { MembersTableComponent } from './members-table/members-table.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MemberFilterDialogComponent } from './member-filter-dialog/member-filter-dialog.component';
import { MatChipsModule } from '@angular/material/chips';
import { SmsService } from '../../core/services/sms.service';
import { DialogService } from '../../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ClubService } from '../../core/services/club.service';

@Component({
  selector: 'app-member-list',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    SHARED,
    MatCardModule,
    MembersTableComponent,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatChipsModule,
  ],
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

  private dialog = inject(MatDialog);
  private dialogService = inject(DialogService);
  private smsService = inject(SmsService);
  private clubService = inject(ClubService);
  private t = inject(TranslateService);
  private snack = inject(MatSnackBar);

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

  sendMessageMutation = injectMutation(() => ({
    mutationFn: (dto: { filter: FilterMemberV2Dto; message: string }) =>
      lastValueFrom(this.http.post<void>(`/members/filter-v2/sms`, dto)),
    onMutate: () => {
      this.snack.open(this.t.instant('sms.sending'), '', { duration: 4000 });
    },
    onSuccess: (response) => {
      this.snack.open(this.t.instant('sms.sentSuccessfully'), '', { duration: 2000 });
    },
  }));

  walletChargeMutation = injectMutation(() => ({
    mutationFn: (dto: { memberId: string; amount: number }) =>
      lastValueFrom(this.http.post<void>(`/wallets/charge`, dto)),
    onMutate: () => {
      this.snack.open(this.t.instant('app.saving'), '', { duration: 4000 });
    },
    onSuccess: (response) => {
      this.snack.open(this.t.instant('app.savedSuccessfully'), '', { duration: 2000 });
      this.query.refetch();
    },
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

  openFilterDialog() {
    const dialogRef = this.dialog.open(MemberFilterDialogComponent, {
      width: '400px',
      data: this.filterDto(),
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.filterDto.update((dto) => ({
          ...dto,
          ...result,
          skip: 0, // reset to first page on filter
        }));
      }
    });
  }

  hasActiveFilters = computed(() => {
    const f = this.filterDto();
    return !!(
      f.joinedAtFromDate ||
      f.joinedAtToDate ||
      f.lastVisitFromDate ||
      f.lastVisitToDate ||
      f.firstOrderFromDate ||
      f.firstOrderToDate ||
      f.lastOrderFromDate ||
      f.lastOrderToDate ||
      f.minOrderCount ||
      f.maxOrderCount ||
      f.orderFromDate ||
      f.orderToDate
    );
  });

  removeFilter(type: 'joinedAt' | 'lastVisit' | 'firstOrder' | 'lastOrder' | 'orderCount') {
    this.filterDto.update((dto) => {
      switch (type) {
        case 'joinedAt':
          return { ...dto, joinedAtFromDate: undefined, joinedAtToDate: undefined, skip: 0 };
        case 'lastVisit':
          return { ...dto, lastVisitFromDate: undefined, lastVisitToDate: undefined, skip: 0 };
        case 'firstOrder':
          return { ...dto, firstOrderFromDate: undefined, firstOrderToDate: undefined, skip: 0 };
        case 'lastOrder':
          return { ...dto, lastOrderFromDate: undefined, lastOrderToDate: undefined, skip: 0 };
        case 'orderCount':
          return {
            ...dto,
            minOrderCount: undefined,
            maxOrderCount: undefined,
            orderFromDate: undefined,
            orderToDate: undefined,
            skip: 0,
          };
        default:
          return dto;
      }
    });
  }

  sendMessage() {
    this.dialogService
      .prompt(
        this.t.instant('sms.newDialog.groupTitle'),
        {
          text: {
            label: this.t.instant('sms.newDialog.textLabel'),
            control: new FormControl('', Validators.required),
            type: 'textarea',
            rows: 4,
          },
        },
        {
          description: this.t.instant('sms.newDialog.description'),
        },
      )
      .then(async (dto) => {
        if (dto?.text) {
          if (
            await this.dialogService.alert(
              this.t.instant('sms.groupConfirmDialog.title'),
              this.t.instant('sms.groupConfirmDialog.description', { value: this.query.data()?.totalCount }),
            )
          ) {
            this.sendMessageMutation.mutate({ filter: this.filterDto(), message: dto.text });
          }
        }
      });
  }

  setStar(member: Member) {
    this.dialogService
      .prompt(this.t.instant('members.setStarDialog.title'), {
        star: {
          label: this.t.instant('members.setStarDialog.starLabel'),
          control: new FormControl(member.star, Validators.required),
          type: 'number',
        },
      })
      .then(async (dto) => {
        if (dto && dto.star >= 0 && dto.star <= 5) {
          this.clubService.saveMemberMutation.mutate({
            id: member.id,
            star: dto.star,
          } as Member);
        }
      });
  }

  chargeWallet(member: Member) {
    this.dialogService
      .prompt(this.t.instant('members.chargeWalletDialog.title'), {
        amount: {
          label: this.t.instant('members.chargeWalletDialog.amountLabel'),
          control: new FormControl(0, Validators.required),
          type: 'number',
          eng: true,
          ltr: true,
        },
      })
      .then(async (dto) => {
        if (dto) {
          this.walletChargeMutation.mutate({ memberId: member.id, amount: dto.amount });
        }
      });
  }
}
