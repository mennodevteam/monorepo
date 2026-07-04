import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { SHARED } from '../shared';
import { DataLoadingComponent } from '../shared/components/data-loading/data-loading.component';
import { DiscountCoupon } from '@menno/types';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

interface CouponUsageReport {
  totalUsages: number;
  totalDiscountAmount: number;
  usages: {
    orderId: string;
    trackingCode?: string;
    createdAt: Date;
    totalPrice: number;
    customerName: string;
    customerPhone: string;
    discountAmount: number;
  }[];
}

@Component({
  selector: 'app-discount-coupon-report-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    MatTableModule,
    SHARED,
    DataLoadingComponent,
  ],
  templateUrl: './discount-coupon-report-dialog.component.html',
  styles: [`
    .summary-container {
      display: flex;
      gap: 16px;
      margin-bottom: 24px;
    }
    .summary-card {
      flex: 1;
      text-align: center;
      border: 1px solid var(--border);
      background: var(--bg-card);
      border-radius: 12px;
      padding: 16px;
    }
    .summary-card h4 {
      margin: 0 0 8px 0;
      color: var(--text-secondary);
      font-size: 0.9rem;
      font-weight: 400;
    }
    .summary-card .value {
      font-size: 1.4rem;
      font-weight: 600;
      color: var(--text-primary);
    }
    .dialog-content {
      min-height: 250px;
      max-height: 60vh;
      overflow-y: auto;
    }
    .empty-state {
      padding: 32px 0;
      text-align: center;
      color: var(--text-secondary);
    }
  `]
})
export class DiscountCouponReportDialogComponent {
  private readonly http = inject(HttpClient);
  readonly ref = inject(MatDialogRef<DiscountCouponReportDialogComponent>);
  readonly coupon = inject<DiscountCoupon>(MAT_DIALOG_DATA);

  readonly displayedColumns = [
    'index',
    'customerName',
    'customerPhone',
    'orderDate',
    'orderAmount',
    'discountValue',
    'actions',
  ];

  query = injectQuery(() => ({
    queryKey: ['discountCouponUsages', this.coupon.id],
    queryFn: () => lastValueFrom(this.http.get<CouponUsageReport>(`/discountCoupons/${this.coupon.id}/usages`)),
  }));

  close() {
    this.ref.close();
  }
}
