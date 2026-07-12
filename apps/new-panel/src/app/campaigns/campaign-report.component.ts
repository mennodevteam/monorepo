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

          <!-- Minimal side-by-side visits & orders cards -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px;">
            
            <mat-card style="padding: 20px; border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); text-align: center; display: flex; flex-direction: column; justify-content: center; min-height: 100px;">
              <span style="font-size: 13px; color: #777; font-weight: 500; display: block; margin-bottom: 6px;">تعداد کل بازدیدها</span>
              <strong style="font-size: 28px; color: #0288d1;">{{ r.visits | number }}</strong>
            </mat-card>

            <mat-card style="padding: 20px; border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); text-align: center; display: flex; flex-direction: column; justify-content: center; min-height: 100px;">
              <span style="font-size: 13px; color: #777; font-weight: 500; display: block; margin-bottom: 6px;">تعداد کل سفارشات</span>
              <strong style="font-size: 28px; color: #2e7d32;">{{ r.orderCount | number }}</strong>
            </mat-card>

          </div>

          <!-- Vertical Financial Statement Card (Addition / Subtraction list format) -->
          <mat-card style="padding: 24px; border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
            <h3 style="margin: 0 0 20px 0; font-weight: bold; border-bottom: 1px solid #f5f5f5; padding-bottom: 12px; font-size: 15px; color: #333;">
              تراز مالی و هزینه‌های عملیاتی کمپین
            </h3>
            
            <div style="display: flex; flex-direction: column; gap: 14px; font-size: 13px;">
              
              <!-- 1. Gross Sales -->
              <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid #f9f9f9;">
                <span style="color: #666;">۱. جمع فروش کل (ناخالص قبل از تخفیف‌ها):</span>
                <span style="color: #333; font-weight: 600;">{{ (r.totalSales + r.totalCampaignDiscounts + r.totalWaivedDeliveryFee) | number }} تومان</span>
              </div>

              <!-- 2. Campaign Discounts -->
              <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px dashed #eee;">
                <span style="color: #777; padding-right: 12px;">تخفیف مستقیم روی محصولات:</span>
                <span style="color: #d32f2f;">{{ r.totalCampaignDiscounts | number }} تومان-</span>
              </div>

              <!-- 3. Waived Delivery -->
              <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px dashed #eee;">
                <span style="color: #777; padding-right: 12px;">تخفیف ارسال رایگان کمپین:</span>
                <span style="color: #d32f2f;">{{ r.totalWaivedDeliveryFee | number }} تومان-</span>
              </div>

              <!-- 4. Final Net Sales -->
              <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px solid #f0f0f0; margin-top: 4px; font-weight: 500;">
                <span style="color: #444;">۲. سود ناخالص فروش (مبلغ دریافتی فاکتورها):</span>
                <span style="color: #111;">{{ r.totalSales | number }} تومان</span>
              </div>

              <!-- 5. Cost of Goods Sold (Material Cost) -->
              <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px dashed #eee;">
                <span style="color: #777; padding-right: 12px;">بهای تمام‌شده مواد اولیه سفارشات:</span>
                <span style="color: #d32f2f;">{{ r.totalMaterialCost | number }} تومان-</span>
              </div>

              <!-- 6. Total Operating Costs -->
              <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px dashed #eee;">
                <span style="color: #777; padding-right: 12px;">مجموع هزینه‌های عملیاتی کمپین (ثبت دستی):</span>
                <span style="color: #d32f2f;">{{ r.totalManualCosts | number }} تومان-</span>
              </div>

              <!-- Manual Operating Costs breakdown list -->
              @if (r.manualCosts?.length) {
                <div style="background-color: #fafafa; padding: 12px; border-radius: 8px; margin: 4px 12px 0 0;">
                  <span style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 6px; font-weight: 500;">ریز جزئیات هزینه‌های عملیاتی:</span>
                  <div style="display: flex; flex-direction: column; gap: 6px; font-size: 11px;">
                    @for (cost of r.manualCosts; track cost.title) {
                      <div style="display: flex; justify-content: space-between; border-bottom: 1px dashed #eee; padding-bottom: 4px;">
                        <span style="color: #555;">{{ cost.title }}:</span>
                        <strong style="color: #d32f2f;">{{ cost.amount | number }} تومان-</strong>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- 7. Solid Final Net Profit Block -->
              <div style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center; background-color: rgba(76, 175, 80, 0.06); padding: 18px 24px; border-radius: 12px; border: 1px solid rgba(76, 175, 80, 0.12);">
                <span style="font-weight: bold; color: #2e7d32; font-size: 14px;">سود خالص نهایی کمپین:</span>
                <strong style="font-size: 22px;" [style.color]="r.netProfit >= 0 ? '#2e7d32' : '#d32f2f'">
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
