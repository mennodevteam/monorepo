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
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

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
    MatDialogModule,
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
        <div style="display: flex; flex-direction: column; gap: 40px;">
          
          <!-- Sleek Header Info (No bulky background box) -->
          <div style="padding: 8px 4px 0 4px;">
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

          <!-- Section 1: Financial Summary (Header outside the card) -->
          <div>
            <h3 style="margin: 0 4px 12px 4px; font-weight: 800; font-size: 15px; color: var(--text-primary);">
              خلاصه عملکرد مالی کمپین
            </h3>
            <mat-card style="padding: 28px; border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.04);">
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
          </div>

          <!-- Section 2: Campaign Operating Costs (Headers outside card, Action Dialog based management) -->
          <div>
            <div fxLayout="row" fxLayoutAlign="space-between center" style="margin: 0 4px 12px 4px;">
              <div fxLayout="column">
                <h3 style="margin: 0 0 4px 0; font-weight: 800; font-size: 15px; color: var(--text-primary);">
                  هزینه‌های عملیاتی کمپین
                </h3>
                <p style="font-size: 12px; color: var(--text-secondary); margin: 0; line-height: 1.6;">
                  هزینه‌های جانبی مربوط به کمپین (مانند تبلیغات، اینفلوئنسرها، بنرها و سایر مبالغ متفرقه)
                </p>
              </div>
              <button mat-stroked-button type="button" (click)="openAddCostDialog(addCostDialogTemplate)" style="border-radius: 10px;">
                <ng-icon name="saxAddOutline" style="vertical-align: middle; margin-left: 4px;"></ng-icon>
                افزودن هزینه جدید
              </button>
            </div>
            
            <mat-card style="padding: 24px; border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
              @if (r.manualCosts?.length) {
                <div style="display: flex; flex-direction: column; gap: 8px;">
                  @for (cost of r.manualCosts; track cost.title; let idx = $index) {
                    <div style="display: flex; justify-content: space-between; align-items: center; font-size: 13px; color: var(--text-primary); border-bottom: 1px solid #f9f9f9; padding: 10px 8px;">
                      <span>{{ cost.title }}</span>
                      <div fxLayout="row" fxLayoutAlign="end center" fxLayoutGap="16px">
                        <strong>{{ cost.amount | number }} تومان</strong>
                        <button mat-icon-button type="button" (click)="deleteCost(idx)" style="color: var(--red-color, #f44336); width: 36px; height: 36px; line-height: 36px;">
                          <ng-icon name="saxTrashOutline" style="font-size: 1.1rem;"></ng-icon>
                        </button>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <p style="text-align: center; color: var(--text-muted); margin: 20px 0; font-size: 13px;">هیچ هزینه عملیاتی برای این کمپین ثبت نشده است.</p>
              }
            </mat-card>
          </div>

          <!-- Section 3: Campaign Orders List -->
          <div>
            <h3 style="margin: 0 4px 12px 4px; font-weight: 800; font-size: 15px; color: var(--text-primary);">
              سفارشات ثبت شده در بازه کمپین
            </h3>
            <mat-card style="padding: 24px; border: none; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
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
                <p style="text-align: center; color: var(--text-muted); margin: 20px 0; font-size: 13px;">هیچ سفارشی در بازه اجرای این کمپین ثبت نشده است.</p>
              }
            </mat-card>
          </div>

        </div>
      } @else {
        <div style="text-align: center; padding: 40px;">
          <p style="color: var(--red-color); font-size: 16px;">خطا در دریافت اطلاعات گزارش کمپین</p>
          <button mat-flat-button color="primary" (click)="goBack()" style="margin-top: 12px;">بازگشت به لیست</button>
        </div>
      }
    </main>

    <!-- Dialog Template for Adding a Cost Row -->
    <ng-template #addCostDialogTemplate>
      <h2 mat-dialog-title style="font-family: 'Estedad'; direction: rtl; margin-top: 8px; font-weight: bold; font-size: 16px;">افزودن هزینه عملیاتی جدید</h2>
      <mat-dialog-content style="font-family: 'Estedad'; direction: rtl; padding-top: 16px;">
        <form [formGroup]="costForm" style="display: flex; flex-direction: column; gap: 16px; padding: 4px 0;">
          <mat-form-field appearance="outline" style="width: 100%;">
            <mat-label>عنوان هزینه (مثلا: تبلیغات اینستاگرام)</mat-label>
            <input matInput formControlName="title" required />
          </mat-form-field>
          
          <mat-form-field appearance="outline" style="width: 100%;">
            <mat-label>مبلغ هزینه (تومان)</mat-label>
            <input matInput formControlName="amount" type="number" required />
          </mat-form-field>
        </form>
      </mat-dialog-content>
      <mat-dialog-actions align="end" style="font-family: 'Estedad'; direction: rtl; gap: 8px; padding: 12px 24px 20px 24px;">
        <button mat-button (click)="closeDialog()">انصراف</button>
        <button mat-flat-button color="primary" [disabled]="costForm.invalid || savingCosts()" (click)="submitNewCost()">
          @if (savingCosts()) {
            در حال ثبت...
          } @else {
            ثبت هزینه
          }
        </button>
      </mat-dialog-actions>
    </ng-template>
  `,
})
export class CampaignReportComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly snack = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);

  loading = signal(true);
  savingCosts = signal(false);
  report = signal<CampaignReport | null>(null);

  costForm = this.fb.group({
    title: ['', Validators.required],
    amount: [null as number | null, [Validators.required, Validators.min(0)]],
  });

  private dialogRef?: MatDialogRef<any>;

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
    } catch (err) {
      console.error(err);
      this.snack.open('خطا در دریافت اطلاعات گزارش کمپین', 'بستن', { duration: 3000 });
    } finally {
      this.loading.set(false);
    }
  }

  openAddCostDialog(template: any) {
    this.costForm.reset({ title: '', amount: null });
    this.dialogRef = this.dialog.open(template, {
      width: '420px',
      direction: 'rtl',
      autoFocus: true,
    });
  }

  closeDialog() {
    this.dialogRef?.close();
  }

  async submitNewCost() {
    if (this.costForm.invalid) return;
    const r = this.report();
    if (!r) return;

    const newCost = this.costForm.value;
    this.savingCosts.set(true);
    try {
      const currentCosts = r.manualCosts || [];
      const updatedCosts = [...currentCosts, newCost];

      await lastValueFrom(
        this.http.put(`/campaigns/${r.campaignId}`, {
          manualCosts: updatedCosts,
        })
      );

      this.snack.open('هزینه عملیاتی جدید با موفقیت ثبت شد', 'بستن', { duration: 3000 });
      this.closeDialog();
      await this.loadReport();
    } catch (err) {
      console.error(err);
      this.snack.open('خطا در ثبت هزینه جدید', 'بستن', { duration: 3000 });
    } finally {
      this.savingCosts.set(false);
    }
  }

  async deleteCost(index: number) {
    const r = this.report();
    if (!r) return;

    if (!confirm('آیا از حذف این هزینه عملیاتی اطمینان دارید؟')) return;

    try {
      const updatedCosts = [...(r.manualCosts || [])];
      updatedCosts.splice(index, 1);

      await lastValueFrom(
        this.http.put(`/campaigns/${r.campaignId}`, {
          manualCosts: updatedCosts,
        })
      );

      this.snack.open('هزینه عملیاتی با موفقیت حذف شد', 'بستن', { duration: 3000 });
      await this.loadReport();
    } catch (err) {
      console.error(err);
      this.snack.open('خطا در حذف هزینه', 'بستن', { duration: 3000 });
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

