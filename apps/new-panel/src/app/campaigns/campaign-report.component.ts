import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Campaign, CampaignManualCost } from '@menno/types';
import { SHARED } from '../shared';
import { DataLoadingComponent } from '../shared/components/data-loading/data-loading.component';

import { MatTooltipModule } from '@angular/material/tooltip';

interface CampaignReport {
  campaignId: string;
  title: string;
  startDate: string;
  endDate: string;
  orderCount: number;
  totalSales: number;
  totalMaterialCost: number;
  totalCampaignDiscounts: number;
  totalWaivedDeliveryFee: number;
  totalManualCosts: number;
  netProfit: number;
  visits: number;
  clicks: number;
  basketAdds: number;
  manualCosts: CampaignManualCost[];
  orders: {
    id: string;
    trackingCode?: string;
    totalPrice: number;
    materialCost?: number;
    createdAt: string;
    state: string;
    customer?: {
      firstName?: string;
      lastName?: string;
    } | null;
  }[];
}

@Component({
  selector: 'app-campaign-report',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    RouterModule,
    SHARED,
    DataLoadingComponent,
  ],
  template: `
    <mat-toolbar class="content-toolbar" fxLayout="row" fxLayoutGap="8px">
      <button mat-icon-button type="button" (click)="goBack()">
        <ng-icon name="saxArrowRight3Bold"></ng-icon>
      </button>
      <h1 fxFlex>گزارش عملکرد کمپین</h1>
      <button mat-button type="button" (click)="goBack()">
        بازگشت به لیست
      </button>
    </mat-toolbar>

    <main p-md w-lg class="np-form-container" style="font-family: 'Estedad'; direction: rtl;">
      @if (loading()) {
        <app-data-loading />
      } @else if (report()) {
        @let r = report()!;
        <div style="display: flex; flex-direction: column; gap: 24px;">
          
          <!-- Sleek Header Info (No bulky background box) -->
          <div style="padding: 8px 4px;">
            <h2 style="margin: 0 0 6px 0; font-weight: 800; font-size: 20px; color: var(--text-primary);">
              گزارش عملکرد: {{ r.title }}
            </h2>
            <div style="font-size: 13px; color: var(--text-secondary); display: flex; gap: 24px; flex-wrap: wrap;">
              <span>📅 <strong>تاریخ شروع:</strong> {{ r.startDate | pdate: true }}</span>
              <span>🏁 <strong>تاریخ پایان:</strong> {{ r.endDate | pdate: true }}</span>
            </div>
          </div>

          <!-- Three side-by-side stats boxes with large padding -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px;">
            
            <mat-card style="padding: 28px 24px; border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); text-align: center; display: flex; flex-direction: column; justify-content: center; min-height: 110px;">
              <span style="font-size: 13px; color: #777; font-weight: 500; display: block; margin-bottom: 8px;">تعداد کل بازدیدها</span>
              <strong style="font-size: 26px; color: #0288d1;">{{ r.visits | number }}</strong>
            </mat-card>

            <mat-card style="padding: 28px 24px; border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); text-align: center; display: flex; flex-direction: column; justify-content: center; min-height: 110px;">
              <span style="font-size: 13px; color: #777; font-weight: 500; display: block; margin-bottom: 8px;">تعداد کل سفارشات</span>
              <strong style="font-size: 26px; color: #2e7d32;">{{ r.orderCount | number }}</strong>
            </mat-card>

            <mat-card style="padding: 28px 24px; border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); text-align: center; display: flex; flex-direction: column; justify-content: center; min-height: 110px;">
              <span style="font-size: 13px; color: #777; font-weight: 500; display: block; margin-bottom: 8px;">مجموع فروش کل (خالص دریافتی)</span>
              <strong style="font-size: 24px; color: #ff9800;">{{ r.totalSales | number }} تومان</strong>
            </mat-card>

          </div>

          <!-- Vertical Financial Statement Card (Simplistic list format) -->
          <mat-card style="padding: 28px; border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
            <h3 style="margin: 0 0 20px 0; font-weight: bold; border-bottom: 1px solid #f5f5f5; padding-bottom: 12px; font-size: 15px; color: #333;">
              خلاصه عملکرد مالی کمپین
            </h3>
            
            <div style="display: flex; flex-direction: column; gap: 16px; font-size: 13px;">
              
              <!-- 1. Gross Sales -->
              <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid #f9f9f9; padding-left: 8px; padding-right: 8px;">
                <span style="color: #555;">مجموع فروش کل (خالص پرداختی فاکتورها):</span>
                <strong style="color: #111; font-size: 14px;">{{ r.totalSales | number }} تومان</strong>
              </div>

              <!-- 2. Campaign Discounts -->
              <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid #f9f9f9; padding-left: 8px; padding-right: 8px;">
                <span style="color: #555;">مجموع تخفیف‌های مستقیم اعمال شده کمپین:</span>
                <strong style="color: #555;">{{ r.totalCampaignDiscounts | number }} تومان</strong>
              </div>

              <!-- 3. Sales Profit -->
              <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid #f9f9f9; padding-left: 8px; padding-right: 8px;">
                <span style="color: #555; display: flex; align-items: center; gap: 6px;">
                  مجموع سود فروش سفارشات:
                  <ng-icon name="saxInfoCircleOutline" style="color: #aaa; cursor: pointer; font-size: 1rem; vertical-align: middle;" matTooltip="مجموع سود همه سفارشات کمپین (فروش کل منهای بهای تمام‌شده مواد اولیه)"></ng-icon>
                </span>
                <strong style="color: #2e7d32; font-size: 14px;">{{ (r.totalSales - r.totalMaterialCost) | number }} تومان</strong>
              </div>

              <!-- 4. Campaign Operating Costs -->
              <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid #f9f9f9; padding-left: 8px; padding-right: 8px;">
                <span style="color: #555; display: flex; align-items: center; gap: 6px;">
                  هزینه‌های عملیاتی کمپین:
                  <ng-icon name="saxInfoCircleOutline" style="color: #aaa; cursor: pointer; font-size: 1rem; vertical-align: middle;" matTooltip="مجموع هزینه‌های متفرقه کمپین مانند تبلیغات، بلاگرها و... که در بخش ویرایش کمپین ثبت شده است"></ng-icon>
                </span>
                <strong style="color: #e65100; font-size: 14px;">{{ r.totalManualCosts | number }} تومان</strong>
              </div>

              <!-- Manual Operating Costs breakdown list -->
              @if (r.manualCosts?.length) {
                <div style="background-color: #fafafa; padding: 16px; border-radius: 12px; margin-right: 8px; margin-left: 8px; display: flex; flex-direction: column; gap: 8px;">
                  <span style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 4px; font-weight: 500;">ریز هزینه‌های عملیاتی ثبت شده:</span>
                  @for (cost of r.manualCosts; track cost.title) {
                    <div style="display: flex; justify-content: space-between; font-size: 12px; color: #555; border-bottom: 1px dashed #eee; padding-bottom: 6px;">
                      <span>{{ cost.title }}:</span>
                      <strong>{{ cost.amount | number }} تومان</strong>
                    </div>
                  }
                </div>
              }

              <!-- 5. Net Profit -->
              <div style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center; background-color: rgba(76, 175, 80, 0.08); padding: 20px 24px; border-radius: 14px; border: 1px solid rgba(76, 175, 80, 0.15);">
                <span style="font-weight: bold; color: #1b5e20; font-size: 15px; display: flex; align-items: center; gap: 6px;">
                  سود خالص نهایی کمپین:
                  <ng-icon name="saxInfoCircleOutline" style="color: #aaa; cursor: pointer; font-size: 1.1rem; vertical-align: middle;" matTooltip="سود نهایی کمپین حاصل کسر تمام هزینه‌های عملیاتی از سود فروش سفارشات"></ng-icon>
                </span>
                <strong style="font-size: 24px;" [style.color]="r.netProfit >= 0 ? '#1b5e20' : '#b71c1c'">
                  {{ r.netProfit | number }} تومان
                </strong>
              </div>

            </div>
          </mat-card>

          <!-- Campaign Orders List Card -->
          <mat-card style="padding: 24px; border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
            <h3 style="margin: 0 0 16px 0; font-weight: bold; border-bottom: 1px solid #f5f5f5; padding-bottom: 12px; font-size: 15px; color: #333;">
              سفارشات ثبت شده در بازه کمپین
            </h3>
            @if (r.orders?.length) {
              <div style="max-height: 400px; overflow-y: auto;">
                <table style="width: 100%; border-collapse: collapse; text-align: right; font-size: 13px;">
                  <thead>
                    <tr style="border-bottom: 2px solid #f5f5f5; color: var(--text-secondary); height: 40px;">
                      <th style="padding: 8px; font-weight: 600;">نام مشتری</th>
                      <th style="padding: 8px; font-weight: 600;">تاریخ ثبت</th>
                      <th style="padding: 8px; font-weight: 600;">مبلغ فاکتور</th>
                      <th style="padding: 8px; font-weight: 600;">سود سفارش</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (order of r.orders; track order.id) {
                      <tr style="border-bottom: 1px solid #f5f5f5; height: 48px;">
                        <td style="padding: 8px;">
                          <a [routerLink]="['/admin/orders/details', order.id]" style="color: var(--primary-color); font-weight: 600; text-decoration: none;">
                            @if (order.customer) {
                              {{ order.customer.firstName || '' }} {{ order.customer.lastName || '' }}
                            } @else {
                              مشتری مهمان
                            }
                          </a>
                        </td>
                        <td style="padding: 8px; color: #666;">{{ order.createdAt | pdate: true }}</td>
                        <td style="padding: 8px; font-weight: 500;">{{ order.totalPrice | number }} تومان</td>
                        <td style="padding: 8px; font-weight: 500; color: #2e7d32;">
                          {{ (order.totalPrice - (order.materialCost || 0)) | number }} تومان
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <p style="text-align: center; color: var(--text-muted); margin: 20px 0; font-size: 13px;">هیچ سفارشی برای این کمپین ثبت نشده است.</p>
            }
          </mat-card>

        </div>
      } @else {
        <div style="text-align: center; padding: 40px;">
          <p style="color: var(--red-color); font-size: 16px;">خطا در دریافت اطلاعات گزارش کمپین</p>
          <button mat-flat-button color="primary" (click)="goBack()" style="margin-top: 12px;">بازگشت به لیست</button>
        </div>
      }
    </main>
  `,
})
export class CampaignReportComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  loading = signal(true);
  report = signal<CampaignReport | null>(null);

  async ngOnInit() {
    const id = this.route.snapshot.queryParamMap.get('id');
    if (!id) {
      this.router.navigate(['/admin/campaigns']);
      return;
    }

    try {
      const data = await lastValueFrom(this.http.get<CampaignReport>(`/campaigns/${id}/report`));
      this.report.set(data);
    } catch (err) {
      console.error(err);
    } finally {
      this.loading.set(false);
    }
  }

  getClickRate(): string {
    const r = this.report();
    if (!r || !r.visits) return '0';
    return ((r.clicks / r.visits) * 100).toFixed(1);
  }

  getBasketRate(): string {
    const r = this.report();
    if (!r || !r.clicks) return '0';
    return ((r.basketAdds / r.clicks) * 100).toFixed(1);
  }

  getConversionRate(): string {
    const r = this.report();
    if (!r || !r.visits) return '0';
    return ((r.orderCount / r.visits) * 100).toFixed(1);
  }

  getOrderStateLabel(state: string): string {
    switch (state) {
      case 'canceled': return 'لغو شده';
      case 'delivered': return 'تحویل داده شده';
      case 'processing': return 'در حال پردازش';
      case 'pending': return 'در انتظار تایید';
      case 'completed': return 'تکمیل شده';
      case 'ready': return 'آماده تحویل';
      case 'sent': return 'ارسال شده';
      default: return state;
    }
  }

  goBack() {
    this.router.navigate(['/admin/campaigns']);
  }
}
