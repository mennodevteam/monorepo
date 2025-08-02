import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state.component';
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
    EmptyStateComponent,
  ],
  templateUrl: './discount-coupons-list.component.html',
  styleUrl: './discount-coupons-list.component.scss',
})
export class DiscountCouponsListComponent {
  private readonly http = inject(HttpClient);
  private readonly clubService = inject(ClubService);
  private readonly dialog = inject(DialogService);
  private readonly t = inject(TranslateService);
  private readonly router = inject(Router);

  readonly Status = Status;
  readonly displayedColumns = ['index', 'title', 'discount', 'status', 'actions'];

  private query = injectQuery(() => ({
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

  addCoupon() {
    this.router.navigate(['/discount-coupons/edit']);
  }
} 