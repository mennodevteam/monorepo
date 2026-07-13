import { Component, OnInit, inject, computed, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { SHARED } from '../shared';
import { MenuService } from '../menu/menu.service';
import { Campaign, CampaignAction, Product, ProductVariant } from '@menno/types';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { FilesService } from '../core/services/files.service';
import { DialogService } from '../core/services/dialog.service';
import { injectQueryClient } from '@tanstack/angular-query-experimental';

@Component({
  selector: 'app-campaigns-edit',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    ReactiveFormsModule,
    FormsModule,
    MatDatepickerModule,
    MatToolbarModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    MatAutocomplete,
    MatAutocompleteTrigger,
  ],
  templateUrl: './campaigns-edit.component.html',
  styleUrl: './campaigns-list.component.scss',
})
export class CampaignsEditComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly menuService = inject(MenuService);
  private readonly snack = inject(MatSnackBar);
  private readonly t = inject(TranslateService);
  private readonly filesService = inject(FilesService);
  private readonly dialog = inject(DialogService);
  private readonly queryClient = injectQueryClient();

  campaignId = signal<string | null>(null);
  form!: FormGroup;
  timeOptions: string[] = [];

  readonly allProducts = computed<Product[]>(() => {
    const categories = this.menuService.data()?.categories || [];
    const list: Product[] = [];
    for (const c of categories) {
      if (c.products) {
        list.push(...c.products);
      }
    }
    return list;
  });

  readonly allCategories = computed(() => {
    return this.menuService.data()?.categories || [];
  });

  get actions(): FormArray {
    return this.form.get('actions') as FormArray;
  }

  constructor() {
    for (let h = 0; h < 24; h++) {
      for (const m of ['00', '15', '30', '45']) {
        const pad = (n: number) => n.toString().padStart(2, '0');
        this.timeOptions.push(`${pad(h)}:${m}`);
      }
    }

    this.form = this.fb.group({
      title: ['', Validators.required],
      startDate: [null, Validators.required],
      startTime: ['00:00', Validators.required],
      endDate: [null, Validators.required],
      endTime: ['00:00', Validators.required],
      enabled: [true],
      actions: this.fb.array([]),
      showWelcomeDialog: [false],
      welcomeTitle: [''],
      welcomeDescription: [''],
      welcomeImageUrl: [''],
      welcomeCtaText: [''],
      welcomeCtaUrl: [''],
      welcomeCtaLinkType: ['External'],
      welcomeCtaLinkValue: [''],
      showCountdown: [false],
    });

    effect(() => {
      const products = this.allProducts();
      if (products.length > 0) {
        for (let i = 0; i < this.actions.length; i++) {
          const payloadGroup = this.actions.at(i).get('payload') as FormGroup;
          const productId = payloadGroup.get('productId')?.value;
          const currentSearch = payloadGroup.get('productSearch')?.value;
          if (productId && !currentSearch) {
            const product = products.find((p) => p.id === productId);
            if (product) {
              payloadGroup.get('productSearch')?.setValue(product.title);
            }
          }
        }
      }
    });
  }

  async ngOnInit() {
    const id = this.route.snapshot.queryParamMap.get('id');
    if (id) {
      this.campaignId.set(id);
      try {
        const campaign = await lastValueFrom(this.http.get<Campaign>(`/campaigns/${id}`));
        const start = new Date(campaign.startDate);
        const end = new Date(campaign.endDate);

        const pad = (n: number) => n.toString().padStart(2, '0');
        const startTimeStr = `${pad(start.getHours())}:${pad(Math.floor(start.getMinutes() / 15) * 15)}`;
        const endTimeStr = `${pad(end.getHours())}:${pad(Math.floor(end.getMinutes() / 15) * 15)}`;

        this.form.patchValue({
          title: campaign.title,
          startDate: start,
          startTime: startTimeStr,
          endDate: end,
          endTime: endTimeStr,
          enabled: campaign.enabled,
          showWelcomeDialog: campaign.showWelcomeDialog,
          welcomeTitle: campaign.welcomeTitle,
          welcomeDescription: campaign.welcomeDescription,
          welcomeImageUrl: campaign.welcomeImageUrl,
          welcomeCtaText: campaign.welcomeCtaText,
          welcomeCtaUrl: campaign.welcomeCtaUrl,
          welcomeCtaLinkType: campaign.welcomeCtaLinkType || 'External',
          welcomeCtaLinkValue: campaign.welcomeCtaLinkValue || '',
          showCountdown: campaign.showCountdown,
        });

        if (campaign.actions) {
          for (const action of campaign.actions as CampaignAction[]) {
            this.addAction(action);
          }
        }
      } catch (error) {
        this.snack.open('خطا در لود کمپین', 'بستن', { duration: 3000 });
      }
    }
  }

  productDisplayFn = (product: Product | string | null | undefined): string => {
    if (!product) return '';
    return typeof product === 'string' ? product : (product as Product).title || '';
  };

  getFilteredProducts(index: number): Product[] {
    const searchVal = this.actions.at(index).get('payload.productSearch')?.value || '';
    const products = this.allProducts();
    if (!searchVal) return products;
    return products.filter((p) => p.title.toLowerCase().includes(searchVal.toLowerCase()));
  }

  onProductSelected(product: Product, index: number) {
    const payloadGroup = this.actions.at(index).get('payload') as FormGroup;
    payloadGroup.get('productId')?.setValue(product.id);
    payloadGroup.get('productId')?.markAsDirty();
    payloadGroup.get('variantId')?.setValue('');
    payloadGroup.get('variantId')?.markAsDirty();
  }

  getProductVariants(productId: string): ProductVariant[] {
    const product = this.allProducts().find((p: Product) => p.id === productId);
    return product?.variants || [];
  }

  addAction(action?: CampaignAction) {
    const payload = action?.payload;
    const product = this.allProducts().find((p: Product) => p.id === payload?.productId);

    const payloadGroup = this.fb.group({
      minOrderValue: [payload?.minOrderValue || 0],
      productId: [payload?.productId || ''],
      productSearch: [product ? product.title : ''],
      variantId: [payload?.variantId || ''],
      categoryId: [payload?.categoryId || ''],
      discountType: [payload?.discountType || 'percent'],
      discountValue: [payload?.discountValue || 0],
    });

    payloadGroup.get('productSearch')?.valueChanges.subscribe((val: Product | string | null) => {
      const currentProductId = payloadGroup.get('productId')?.value;
      const currentProduct = this.allProducts().find((p) => p.id === currentProductId);
      const searchString = typeof val === 'string' ? val : (val as Product)?.title || '';

      if (!val) {
        payloadGroup.get('productId')?.setValue('');
        payloadGroup.get('productId')?.markAsDirty();
      } else if (!currentProduct || currentProduct.title !== searchString) {
        payloadGroup.get('productId')?.setValue('');
        payloadGroup.get('productId')?.markAsDirty();
      }
    });

    const actionForm = this.fb.group({
      type: [action?.type || 'free_delivery', Validators.required],
      payload: payloadGroup,
    });
    this.actions.push(actionForm);
  }

  removeAction(index: number) {
    this.actions.removeAt(index);
  }

  private combineDateAndTime(dateVal: any, timeStr: string): Date {
    const d = new Date(dateVal);
    const [hours, minutes] = timeStr.split(':').map(Number);
    d.setHours(hours);
    d.setMinutes(minutes);
    d.setSeconds(0);
    d.setMilliseconds(0);
    return d;
  }

  getFileUrl(key: string): string {
    if (!key) return '';
    if (key.startsWith('http')) return key;
    return this.filesService.getFileUrl(key);
  }

  async uploadWelcomeImage() {
    const res = await this.dialog.imageCropper({
      maintainAspectRatio: false,
    });
    if (!res?.file) return;

    const uploading = this.snack.open('در حال آپلود تصویر بنر...', '', { duration: 0 });
    try {
      const saved = await this.filesService.upload(res.file, 'campaignWelcomeBanner');
      if (!saved?.key) {
        this.snack.open('خطا در آپلود فایل', '', { duration: 3000 });
        return;
      }
      this.form.patchValue({ welcomeImageUrl: saved.key });
      this.form.markAsDirty();
    } catch (err) {
      this.snack.open('خطا در آپلود فایل بنر', 'بستن', { duration: 3000 });
    } finally {
      uploading.dismiss();
    }
  }

  clearWelcomeImage() {
    this.form.patchValue({ welcomeImageUrl: '' });
    this.form.markAsDirty();
  }

  async save() {
    if (this.form.invalid) {
      this.snack.open('لطفا فیلدهای اجباری را پر کنید', 'بستن', { duration: 3000 });
      return;
    }

    const val = this.form.value;
    const start = this.combineDateAndTime(val.startDate, val.startTime);
    const end = this.combineDateAndTime(val.endDate, val.endTime);

    if (start.getTime() >= end.getTime()) {
      this.snack.open('تاریخ شروع باید قبل از تاریخ پایان باشد', 'بستن', { duration: 3000 });
      return;
    }

    const actionsPayload = (val.actions || []).map((action: CampaignAction & { payload?: { productSearch?: string } }) => {
      if (action.payload) {
        const payloadCopy = { ...action.payload };
        delete payloadCopy.productSearch;
        return {
          ...action,
          payload: payloadCopy,
        };
      }
      return action;
    });

    const payload: Partial<Campaign> = {
      title: val.title,
      startDate: start,
      endDate: end,
      enabled: val.enabled,
      actions: actionsPayload,
      showWelcomeDialog: val.showWelcomeDialog,
      welcomeTitle: val.welcomeTitle,
      welcomeDescription: val.welcomeDescription,
      welcomeImageUrl: val.welcomeImageUrl,
      welcomeCtaText: val.welcomeCtaText,
      welcomeCtaUrl: val.welcomeCtaUrl,
      welcomeCtaLinkType: val.welcomeCtaLinkType,
      welcomeCtaLinkValue: val.welcomeCtaLinkValue,
      showCountdown: val.showCountdown,
    };

    try {
      if (this.campaignId()) {
        await lastValueFrom(this.http.put(`/campaigns/${this.campaignId()}`, payload));
        this.snack.open('کمپین با موفقیت بروزرسانی شد', 'بستن', { duration: 3000 });
      } else {
        await lastValueFrom(this.http.post('/campaigns', payload));
        this.snack.open('کمپین جدید با موفقیت ایجاد شد', 'بستن', { duration: 3000 });
      }
      this.queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      this.queryClient.invalidateQueries({ queryKey: ['activeCampaign'] });
      this.queryClient.invalidateQueries({ queryKey: ['menus'] });
      this.router.navigate(['/admin/campaigns']);
    } catch (err: any) {
      const msg = err.error?.message || 'خطا در ثبت کمپین';
      this.snack.open(msg, 'بستن', { duration: 4000 });
    }
  }

  cancel() {
    this.router.navigate(['/admin/campaigns']);
  }
}
