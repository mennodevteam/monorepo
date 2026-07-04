import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state.component';
import { DataLoadingComponent } from '../shared/components/data-loading/data-loading.component';
import { Router } from '@angular/router';
import { DiscountCoupon, Status } from '@menno/types';
import { ClubService } from '../core/services/club.service';
import { DialogService } from '../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { sortByCreatedAtDesc } from '@menno/utils';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { computed } from '@angular/core';
import { DiscountCouponReportDialogComponent } from './discount-coupon-report-dialog.component';

@Component({
  selector: 'app-discount-coupons-list',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatToolbarModule,
    MatCardModule,
    MatTableModule,
    MatSlideToggleModule,
    MatTabsModule,
    MatDialogModule,
    EmptyStateComponent,
    DataLoadingComponent,
  ],
  templateUrl: './discount-coupons-list.component.html',
  styleUrl: './discount-coupons-list.component.scss',
})
export class DiscountCouponsListComponent {
  private readonly http = inject(HttpClient);
  private readonly clubService = inject(ClubService);
  private readonly dialog = inject(DialogService);
  private readonly dialogCtrl = inject(MatDialog);
  private readonly t = inject(TranslateService);
  private readonly router = inject(Router);

  readonly Status = Status;
  readonly displayedColumns = ['index', 'title', 'code', 'discount', 'restrictions', 'status', 'actions'];

  query = injectQuery(() => ({
    queryKey: ['discountCoupons'],
    queryFn: () => lastValueFrom(this.http.get<DiscountCoupon[]>('/discountCoupons')),
  }));

  data = computed(() => {
    const coupons = this.query.data();
    if (coupons) {
      return [...coupons].sort(sortByCreatedAtDesc);
    }
    return [];
  });

  isEmptyData = computed(() => this.data()?.length === 0);

  isCouponActive(coupon: DiscountCoupon): boolean {
    if (coupon.status !== Status.Active) return false;
    const now = new Date();
    if (coupon.startedAt && new Date(coupon.startedAt) > now) return false;
    if (coupon.expiredAt && new Date(coupon.expiredAt) < now) return false;
    if (coupon.maxUse && coupon.usedCount != null && coupon.usedCount >= coupon.maxUse) return false;
    return true;
  }

  activeCoupons = computed(() => {
    return this.data().filter((c) => this.isCouponActive(c));
  });

  inactiveCoupons = computed(() => {
    return this.data().filter((c) => !this.isCouponActive(c));
  });

  getCouponStatus(coupon: DiscountCoupon): { label: string; color: string } {
    if (coupon.status === Status.Inactive) {
      return { label: 'discountCoupons.statusInactive', color: 'gray' };
    }
    const now = new Date();
    if (coupon.startedAt && new Date(coupon.startedAt) > now) {
      return { label: 'discountCoupons.statusUpcoming', color: 'blue' };
    }
    if (coupon.expiredAt && new Date(coupon.expiredAt) < now) {
      return { label: 'discountCoupons.statusExpired', color: 'red' };
    }
    if (coupon.maxUse && coupon.usedCount != null && coupon.usedCount >= coupon.maxUse) {
      return { label: 'discountCoupons.statusCompleted', color: 'orange' };
    }
    return { label: 'discountCoupons.statusActive', color: 'green' };
  }

  async changeStatus(coupon: DiscountCoupon, checked: boolean) {
    const prevStatus = coupon.status;
    const newStatus = checked ? Status.Active : Status.Inactive;
    coupon.status = Status.Pending;
    
    try {
      await this.clubService.saveDiscountCouponMutation.mutateAsync({
        id: coupon.id,
        status: newStatus,
      });
      coupon.status = newStatus;
    } catch (error) {
      coupon.status = prevStatus;
    }
  }

  async deleteCoupon(coupon: DiscountCoupon) {
    const confirmed = await this.dialog.alert(
      this.t.instant('app.confirmDelete'),
      this.t.instant('app.deleteConfirmMessage', { value: coupon.title }),
    );

    if (confirmed) {
      this.clubService.deleteDiscountCouponMutation.mutate(coupon.id);
    }
  }

  openReport(coupon: DiscountCoupon) {
    this.dialogCtrl.open(DiscountCouponReportDialogComponent, {
      width: '850px',
      data: coupon,
    });
  }

  addCoupon() {
    this.router.navigate(['/admin/coupons/edit']);
  }
}