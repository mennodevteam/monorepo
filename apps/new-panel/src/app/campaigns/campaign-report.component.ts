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
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';

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
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
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

          <!-- Three side-by-side stats boxes with large padding and neutral theme colors -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px;">
            
            <mat-card style="padding: 28px 24px; border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); text-align: center; display: flex; flex-direction: column; justify-content: center; min-height: 110px;">
              <span style="font-size: 13px; color: var(--text-secondary); font-weight: 500; display: block; margin-bottom: 8px;">تعداد کل بازدیدها</span>
              <strong style="font-size: 26px; color: var(--text-primary);">{{ r.visits | number }}</strong>
            </mat-card>

            <mat-card style="padding: 28px 24px; border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); text-align: center; display: flex; flex-direction: column; justify-content: center; min-height: 110px;">
              <span style="font-size: 13px; color: var(--text-secondary); font-weight: 500; display: block; margin-bottom: 8px;">تعداد کل سفارشات</span>
              <strong style="font-size: 26px; color: var(--text-primary);">{{ r.orderCount | number }}</strong>
            </mat-card>

            <mat-card style="padding: 28px 24px; border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); text-align: center; display: flex; flex-direction: column; justify-content: center; min-height: 110px;">
              <span style="font-size: 13px; color: var(--text-secondary); font-weight: 500; display: block; margin-bottom: 8px;">مجموع فروش</span>
              <strong style="font-size: 26px; color: var(--text-primary);">{{ r.totalSales | number }} تومان</strong>
            </mat-card>

          </div>

          <!-- Vertical Financial Statement Card (Simplistic list format, matching design system) -->
          <mat-card style="padding: 28px; border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
            <h3 style="margin: 0 0 20px 0; font-weight: bold; border-bottom: 1px solid #f5f5f5; padding-bottom: 12px; font-size: 15px; color: var(--text-primary);">
              خلاصه عملکرد مالی کمپین
            </h3>
            
            <div style="display: flex; flex-direction: column; gap: 16px; font-size: 13px;">
              
              <!-- 1. Gross Sales -->
              <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid #f9f9f9; padding-left: 8px; padding-right: 8px;">
                <span style="color: var(--text-secondary);">مجموع فروش کل (خالص پرداختی فاکتورها):</span>
                <strong style="color: var(--text-primary); font-size: 14px;">{{ r.totalSales | number }} تومان</strong>
              </div>

              <!-- 2. Campaign Discounts -->
              <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid #f9f9f9; padding-left: 8px; padding-right: 8px;">
                <span style="color: var(--text-secondary);">مجموع تخفیف‌های مستقیم اعمال شده کمپین:</span>
                <strong style="color: var(--text-primary); font-size: 14px;">{{ r.totalCampaignDiscounts | number }} تومان</strong>
              </div>

              <!-- 3. Sales Profit -->
              <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid #f9f9f9; padding-left: 8px; padding-right: 8px;">
                <span style="color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                  مجموع سود فروش سفارشات:
                  <ng-icon name="saxInfoCircleOutline" style="color: var(--text-muted); cursor: pointer; font-size: 1rem; vertical-align: middle;" matTooltip="مجموع سود همه سفارشات کمپین (فروش کل منهای بهای تمام‌شده مواد اولیه)"></ng-icon>
                </span>
                <strong style="color: var(--text-primary); font-size: 14px;">{{ (r.totalSales - r.totalMaterialCost) | number }} تومان</strong>
              </div>

              <!-- 4. Campaign Operating Costs -->
              <div style="display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid #f9f9f9; padding-left: 8px; padding-right: 8px;">
                <span style="color: var(--text-secondary); display: flex; align-items: center; gap: 6px;">
                  هزینه‌های عملیاتی کمپین:
                  <ng-icon name="saxInfoCircleOutline" style="color: var(--text-muted); cursor: pointer; font-size: 1rem; vertical-align: middle;" matTooltip="مجموع هزینه‌های متفرقه کمپین مانند تبلیغات، بلاگرها و... که در جدول پایین صفحه ثبت شده است"></ng-icon>
                </span>
                <strong style="color: var(--text-primary); font-size: 14px;">{{ r.totalManualCosts | number }} تومان</strong>
              </div>

              <!-- 5. Net Profit -->
              <div style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center; background-color: var(--card-bg, #fafafa); padding: 20px 24px; border-radius: 14px; border: 1px solid var(--border-color, #e0e0e0);">
                <span style="font-weight: bold; color: var(--text-primary); font-size: 15px; display: flex; align-items: center; gap: 6px;">
                  سود خالص نهایی کمپین:
                  <ng-icon name="saxInfoCircleOutline" style="color: var(--text-muted); cursor: pointer; font-size: 1.1rem; vertical-align: middle;" matTooltip="سود نهایی کمپین حاصل کسر تمام هزینه‌های عملیاتی از سود فروش سفارشات"></ng-icon>
                </span>
                <strong style="font-size: 24px; color: var(--text-primary); font-weight: 800;">
                  {{ r.netProfit | number }} تومان
                </strong>
              </div>

            </div>
          </mat-card>

          <!-- Campaign Operating Costs Editable Box (Directly managed here) -->
          <mat-card style="padding: 24px; border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 15px; color: var(--text-primary);">
              هزینه‌های عملیاتی کمپین
            </h3>
            <p style="font-size: 12px; color: var(--text-secondary); margin: 0 0 20px 0; line-height: 1.6;">
              هزینه‌های جانبی مربوط به کمپین (مانند تبلیغات، اینفلوئنسرها، بنرها و سایر مبالغ متفرقه) را در اینجا وارد و مدیریت کنید تا سود خالص در لحظه محاسبه شود.
            </p>

            <form [formGroup]="form" (ngSubmit)="saveManualCosts()">
              <div formArrayName="manualCosts" style="display: flex; flex-direction: column; gap: 12px;">
                @for (cost of manualCostsArray.controls; track cost; let idx = $index) {
                  <div [formGroupName]="idx" style="display: flex; gap: 16px; align-items: center; width: 100%;">
                    <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'" style="flex: 2;">
                      <mat-label>عنوان هزینه (مثلا: تبلیغات اینستاگرام)</mat-label>
                      <input matInput formControlName="title" required />
                    </mat-form-field>
                    
                    <mat-form-field appearance="outline" [subscriptSizing]="'dynamic'" style="flex: 1;">
                      <mat-label>مبلغ هزینه (تومان)</mat-label>
                      <input matInput formControlName="amount" type="number" required />
                    </mat-form-field>
                    
                    <button mat-icon-button type="button" (click)="removeManualCost(idx)" style="color: var(--red-color, #f44336);">
                      <ng-icon name="saxTrashOutline"></ng-icon>
                    </button>
                  </div>
                }
              </div>

              <div style="margin-top: 16px; display: flex; gap: 12px; justify-content: flex-start; align-items: center;">
                <button mat-stroked-button type="button" (click)="addManualCost()" style="border-style: dashed; border-color: var(--border-color);">
                  <ng-icon name="saxAddOutline" style="vertical-align: middle; margin-left: 4px;"></ng-icon>
                  افزودن ردیف هزینه جدید
                </button>

                <button mat-flat-button color="primary" type="submit" [disabled]="savingCosts()">
                  @if (savingCosts()) {
                    در حال ذخیره...
                  } @else {
                    ذخیره تغییرات هزینه‌ها
                  }
                </button>
              </div>
            </form>
          </mat-card>

          <!-- Campaign Orders List Card -->
          <mat-card style="padding: 24px; border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
            <h3 style="margin: 0 0 16px 0; font-weight: bold; border-bottom: 1px solid #f5f5f5; padding-bottom: 12px; font-size: 15px; color: var(--text-primary);">
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
                        <td style="padding: 8px; color: var(--text-secondary);">{{ order.createdAt | pdate: true }}</td>
                        <td style="padding: 8px; font-weight: 500;">{{ order.totalPrice | number }} تومان</td>
                        <td style="padding: 8px; font-weight: 500; color: var(--text-primary);">
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
  private readonly fb = inject(FormBuilder);
  private readonly snack = inject(MatSnackBar);

  loading = signal(true);
  savingCosts = signal(false);
  report = signal<CampaignReport | null>(null);

  form = this.fb.group({
    manualCosts: this.fb.array([]),
  });

  get manualCostsArray(): FormArray {
    return this.form.get('manualCosts') as FormArray;
  }

  async ngOnInit() {
    await this.loadReport();
  }

  async loadReport() {
    const id = this.route.snapshot.queryParamMap.get('id');
    if (!id) {
      this.router.navigate(['/admin/campaigns']);
      return;
    }

    this.loading.set(true);
    try {
      const data = await lastValueFrom(this.http.get<CampaignReport>(`/campaigns/${id}/report`));
      this.report.set(data);

      this.manualCostsArray.clear();
      if (data.manualCosts) {
        for (const cost of data.manualCosts) {
          this.manualCostsArray.push(
            this.fb.group({
              title: [cost.title, Validators.required],
              amount: [cost.amount, [Validators.required, Validators.min(0)]],
            })
          );
        }
      }
    } catch (err) {
      console.error(err);
      this.snack.open('خطا در دریافت اطلاعات گزارش کمپین', 'بستن', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  addManualCost() {
    this.manualCostsArray.push(
      this.fb.group({
        title: ['', Validators.required],
        amount: [0, [Validators.required, Validators.min(0)]],
      })
    );
  }

  removeManualCost(index: number) {
    this.manualCostsArray.removeAt(index);
  }

  async saveManualCosts() {
    if (this.form.invalid) {
      this.snack.open('لطفاً اطلاعات هزینه‌ها را به درستی وارد کنید', 'بستن', { duration: 3000 });
      return;
    }

    const id = this.route.snapshot.queryParamMap.get('id');
    this.savingCosts.set(true);
    try {
      await lastValueFrom(
        this.http.put(`/campaigns/${id}`, {
          manualCosts: this.form.value.manualCosts,
        })
      );
      this.snack.open('هزینه‌های عملیاتی با موفقیت بروزرسانی شد', 'بستن', { duration: 3000 });
      await this.loadReport();
    } catch (err) {
      console.error(err);
      this.snack.open('خطا در ذخیره هزینه‌های عملیاتی', 'بستن', { duration: 3000 });
    } finally {
      this.savingCosts.set(false);
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
