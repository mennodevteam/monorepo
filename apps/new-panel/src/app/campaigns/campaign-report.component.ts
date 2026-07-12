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

          <!-- Unified Premium Financial Metrics Card -->
          <mat-card style="padding: 24px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: none; border-radius: 16px;">
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px; text-align: center;">
              
              <div>
                <span style="font-size: 12px; color: #888; display: block; margin-bottom: 6px; font-weight: 500;">سود خالص نهایی</span>
                <strong style="font-size: 24px;" [style.color]="r.netProfit >= 0 ? '#2e7d32' : '#d32f2f'">
                  {{ r.netProfit | number }} تومان
                </strong>
              </div>

              <div style="border-right: 1px solid #f0f0f0; border-left: 1px solid #f0f0f0; padding: 0 12px;">
                <span style="font-size: 12px; color: #888; display: block; margin-bottom: 6px; font-weight: 500;">فروش ناخالص تقریبی</span>
                <strong style="font-size: 24px; color: #333;">
                  {{ (r.totalSales + r.totalCampaignDiscounts + r.totalWaivedDeliveryFee) | number }} تومان
                </strong>
              </div>

              <div>
                <span style="font-size: 12px; color: #888; display: block; margin-bottom: 6px; font-weight: 500;">تعداد سفارشات</span>
                <strong style="font-size: 24px; color: #0288d1;">
                  {{ r.orderCount | number }}
                </strong>
              </div>

            </div>
          </mat-card>

          <!-- Bottom detailed section -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px;">
            
            <!-- Modern Timeline Funnel Card -->
            <mat-card style="padding: 24px; border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
              <h3 style="margin: 0 0 24px 0; font-weight: bold; border-bottom: 1px solid #f5f5f5; padding-bottom: 12px; font-size: 15px; color: #333;">
                قیف رفتار مشتریان (Funnel)
              </h3>
              
              <div style="position: relative; display: flex; flex-direction: column; gap: 24px; padding: 4px 0;">
                <!-- Vertical timeline line -->
                <div style="position: absolute; right: 18px; top: 12px; bottom: 12px; width: 2px; background: #e0e0e0; z-index: 1;"></div>

                <!-- Step 1: Load Menu -->
                <div style="position: relative; display: flex; align-items: center; justify-content: space-between; z-index: 2; padding-right: 42px; min-height: 48px;">
                  <!-- Timeline dot -->
                  <div style="position: absolute; right: 7px; width: 24px; height: 24px; border-radius: 50%; background: #00bcd4; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; box-shadow: 0 2px 6px rgba(0,188,212,0.3);">
                    ۱
                  </div>
                  <div>
                    <span style="color: #666; font-size: 12px; display: block;">بازدید از منو</span>
                    <strong style="font-size: 16px; color: #111;">{{ r.visits | number }}</strong>
                  </div>
                  <span style="font-size: 11px; padding: 4px 10px; border-radius: 12px; background-color: #e0f7fa; color: #00838f; font-weight: 500;">
                    مبنای ۱۰۰٪
                  </span>
                </div>

                <!-- Step 2: Click Product -->
                <div style="position: relative; display: flex; align-items: center; justify-content: space-between; z-index: 2; padding-right: 42px; min-height: 48px;">
                  <!-- Timeline dot -->
                  <div style="position: absolute; right: 7px; width: 24px; height: 24px; border-radius: 50%; background: #0288d1; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; box-shadow: 0 2px 6px rgba(2,136,209,0.3);">
                    ۲
                  </div>
                  <div>
                    <span style="color: #666; font-size: 12px; display: block;">کلیک محصولات</span>
                    <strong style="font-size: 16px; color: #111;">{{ r.clicks | number }}</strong>
                  </div>
                  <span style="font-size: 11px; padding: 4px 10px; border-radius: 12px; background-color: #e1f5fe; color: #0277bd; font-weight: 500;">
                    نرخ کلیک: {{ getClickRate() }}٪
                  </span>
                </div>

                <!-- Step 3: Add to Cart -->
                <div style="position: relative; display: flex; align-items: center; justify-content: space-between; z-index: 2; padding-right: 42px; min-height: 48px;">
                  <!-- Timeline dot -->
                  <div style="position: absolute; right: 7px; width: 24px; height: 24px; border-radius: 50%; background: #ff9800; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; box-shadow: 0 2px 6px rgba(255,152,0,0.3);">
                    ۳
                  </div>
                  <div>
                    <span style="color: #666; font-size: 12px; display: block;">افزودن به سبد</span>
                    <strong style="font-size: 16px; color: #111;">{{ r.basketAdds | number }}</strong>
                  </div>
                  <span style="font-size: 11px; padding: 4px 10px; border-radius: 12px; background-color: #fff3e0; color: #ef6c00; font-weight: 500;">
                    نرخ علاقه: {{ getBasketRate() }}٪
                  </span>
                </div>

                <!-- Step 4: Finished Purchase -->
                <div style="position: relative; display: flex; align-items: center; justify-content: space-between; z-index: 2; padding-right: 42px; min-height: 48px;">
                  <!-- Timeline dot -->
                  <div style="position: absolute; right: 7px; width: 24px; height: 24px; border-radius: 50%; background: #2e7d32; color: white; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; box-shadow: 0 2px 6px rgba(46,125,50,0.3);">
                    ۴
                  </div>
                  <div>
                    <span style="color: #666; font-size: 12px; display: block; font-weight: 500;">ثبت سفارش نهایی</span>
                    <strong style="font-size: 17px; color: #2e7d32;">{{ r.orderCount | number }}</strong>
                  </div>
                  <span style="font-size: 11px; padding: 4px 10px; border-radius: 12px; background-color: #e8f5e9; color: #2e7d32; font-weight: bold;">
                    نرخ تبدیل: {{ getConversionRate() }}٪
                  </span>
                </div>
              </div>
            </mat-card>

            <!-- Detailed Costs & Expenses Card -->
            <mat-card style="padding: 24px; border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
              <h3 style="margin: 0 0 20px 0; font-weight: bold; border-bottom: 1px solid #f5f5f5; padding-bottom: 12px; font-size: 15px; color: #333;">
                تخفیف‌ها و هزینه‌ها
              </h3>
              
              <div style="display: flex; flex-direction: column; gap: 16px; font-size: 13px;">
                <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px dashed #eee;">
                  <span style="color: #666;">تخفیف مستقیم روی محصولات:</span>
                  <span style="color: #f44336; font-weight: 500;">{{ r.totalCampaignDiscounts | number }} تومان-</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px dashed #eee;">
                  <span style="color: #666;">هزینه ارسال هدیه (رایگان):</span>
                  <span style="color: #f44336; font-weight: 500;">{{ r.totalWaivedDeliveryFee | number }} تومان-</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px dashed #eee;">
                  <span style="color: #666;">بهای تمام‌شده مواد اولیه سفارشات:</span>
                  <span style="color: #f44336; font-weight: 500;">{{ r.totalMaterialCost | number }} تومان-</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding-bottom: 8px; border-bottom: 1px dashed #eee;">
                  <span style="color: #666;">مجموع هزینه‌های مازاد دستی کمپین:</span>
                  <span style="color: #f44336; font-weight: 500;">{{ r.totalManualCosts | number }} تومان-</span>
                </div>

                <!-- Manual Costs breakdown list -->
                @if (r.manualCosts?.length) {
                  <div style="background-color: #fafafa; padding: 12px; border-radius: 8px; margin-top: 4px;">
                    <span style="font-size: 11px; color: var(--text-muted); display: block; margin-bottom: 8px; font-weight: 500;">جزئیات هزینه‌های دستی:</span>
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

                <div style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center; background-color: rgba(76, 175, 80, 0.06); padding: 16px; border-radius: 12px; border: 1px solid rgba(76, 175, 80, 0.12);">
                  <span style="font-weight: bold; color: #2e7d32; font-size: 14px;">سود خالص نهایی کمپین:</span>
                  <strong style="font-size: 20px;" [style.color]="r.netProfit >= 0 ? '#2e7d32' : '#d32f2f'">
                    {{ r.netProfit | number }} تومان
                  </strong>
                </div>
              </div>
            </mat-card>

          </div>

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
                      <th style="padding: 8px; font-weight: 600;">کد رهگیری</th>
                      <th style="padding: 8px; font-weight: 600;">تاریخ ثبت</th>
                      <th style="padding: 8px; font-weight: 600;">مبلغ فاکتور</th>
                      <th style="padding: 8px; font-weight: 600;">بهای مواد اولیه</th>
                      <th style="padding: 8px; font-weight: 600;">وضعیت فاکتور</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (order of r.orders; track order.id) {
                      <tr style="border-bottom: 1px solid #f5f5f5; height: 48px;">
                        <td style="padding: 8px;">
                          <a [routerLink]="['/admin/orders/details', order.id]" style="color: var(--primary-color); font-weight: 600; text-decoration: none;">
                            {{ order.trackingCode || '—' }}
                          </a>
                        </td>
                        <td style="padding: 8px; color: #666;">{{ order.createdAt | pdate: true }}</td>
                        <td style="padding: 8px; font-weight: 500;">{{ order.totalPrice | number }} تومان</td>
                        <td style="padding: 8px; color: #666;">{{ (order.materialCost || 0) | number }} تومان</td>
                        <td style="padding: 8px;">
                          <span style="font-size: 11px; padding: 4px 8px; border-radius: 4px; background-color: #f5f5f5; color: #555;">
                            {{ getOrderStateLabel(order.state) }}
                          </span>
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
