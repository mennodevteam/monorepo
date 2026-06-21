import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { injectQuery, injectQueryClient, injectMutation } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SHARED } from '../shared';
import { DialogService } from '../core/services/dialog.service';
import { ShopApiKey } from '@menno/types';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-developer-api',
  standalone: true,
  imports: [
    SHARED,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule,
    MatListModule,
    MatDividerModule,
    MatTableModule,
    MatTooltipModule,
  ],
  templateUrl: './developer-api.component.html',
  styleUrl: './developer-api.component.scss',
})
export class DeveloperApiComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(DialogService);
  private readonly translate = inject(TranslateService);
  private readonly snack = inject(MatSnackBar);
  private readonly queryClient = injectQueryClient();

  readonly openApiUrl = `${environment.apiUrl.replace(/\/+$/, '')}/api/v1/shop-integration/openapi.json`;
  readonly newGeneratedKey = signal<string | null>(null);

  ngOnInit() {
    const onboardingSeen = localStorage.getItem('menno_onboarding_developer_api');
    if (!onboardingSeen) {
      this.dialog.alert(
        'راهنمای بخش کلیدهای دسترسی (API)',
        'در این بخش می‌توانید کلیدهای دسترسی (API Keys) مختلفی برای اتصال ربات‌ها و ابزارهای هوش مصنوعی مانند Gemini Spark بسازید. پس از ساخت کلید، آن را کپی کرده و به همراه آدرس OpenAPI به هوش مصنوعی مورد نظر ارائه دهید تا بتواند با سیستم شما ارتباط برقرار کند.',
        { config: { data: { hideCancel: true, okText: 'متوجه شدم' } } }
      ).then(() => {
        localStorage.setItem('menno_onboarding_developer_api', 'true');
      });
    }
  }

  private readonly keysQuery = injectQuery(() => ({
    queryKey: ['shopApiKeys'],
    queryFn: () => lastValueFrom(this.http.get<ShopApiKey[]>('/shopApiKeys')),
  }));

  readonly apiKeys = computed(() => this.keysQuery.data() || []);
  readonly isLoading = computed(() => this.keysQuery.isPending());

  private readonly createKeyMutation = injectMutation(() => ({
    mutationFn: (dto: { description: string; scopes: string[] }) =>
      lastValueFrom(this.http.post<{ apiKey: ShopApiKey; rawKey: string }>('/shopApiKeys', dto)),
    onSuccess: (res) => {
      this.queryClient.invalidateQueries({ queryKey: ['shopApiKeys'] });
      this.newGeneratedKey.set(res.rawKey);
      this.snack.open(this.translate.instant('app.savedSuccessfully') || 'کلید با موفقیت ساخته شد', '', { duration: 2000 });
    },
  }));

  private readonly deleteKeyMutation = injectMutation(() => ({
    mutationFn: (id: string) => lastValueFrom(this.http.delete(`/shopApiKeys/${id}`)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['shopApiKeys'] });
      this.snack.open(this.translate.instant('app.deletedSuccessfully') || 'کلید با موفقیت حذف شد', '', { duration: 2000 });
    },
  }));

  generateNewKey() {
    this.dialog
      .prompt('ساخت کلید دسترسی جدید (API Key)', {
        description: {
          label: 'توضیحات کلید',
          control: new FormControl('', Validators.required),
          placeholder: 'مثلاً: اتصال به دستیار Gemini Spark',
          type: 'text',
        },
        scopes: {
          label: 'سطوح دسترسی (Permissions)',
          control: new FormControl([], Validators.required),
          type: 'select',
          multiple: true,
          options: [
            { value: 'menu:read', text: 'کاتالوگ: خواندن (محصولات و دسته‌بندی‌ها)' },
            { value: 'menu:write', text: 'کاتالوگ: نوشتن (افزودن و ویرایش محصولات)' },
            { value: 'orders:read', text: 'سفارشات: خواندن (لیست و جزئیات سفارشات)' },
            { value: 'orders:write', text: 'سفارشات: نوشتن (تغییر وضعیت سفارش)' },
            { value: 'reports:read', text: 'گزارشات: خواندن (گزارش‌های فروش)' },
            { value: 'shop:read', text: 'تنظیمات فروشگاه: خواندن' },
            { value: 'shop:write', text: 'تنظیمات فروشگاه: نوشتن' },
          ],
        },
      })
      .then((res) => {
        if (res && res.description && res.scopes) {
          this.createKeyMutation.mutate({
            description: res.description,
            scopes: res.scopes,
          });
        }
      });
  }

  deleteKey(key: ShopApiKey) {
    this.dialog
      .alert('حذف کلید دسترسی', `آیا از حذف کلید دسترسی "${key.description}" اطمینان دارید؟`, {
        config: { data: { confirm: true } },
      })
      .then((confirmed) => {
        if (confirmed) {
          this.deleteKeyMutation.mutate(key.id);
        }
      });
  }

  copyToClipboardSuccess() {
    this.snack.open('کپی شد!', '', { duration: 2000 });
  }

  closeGeneratedKeyPanel() {
    this.newGeneratedKey.set(null);
  }
}
