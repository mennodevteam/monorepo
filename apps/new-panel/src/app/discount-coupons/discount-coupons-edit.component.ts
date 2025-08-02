import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DiscountCoupon, Status, MemberTag } from '@menno/types';
import { ClubService } from '../core/services/club.service';
import { injectQuery, injectMutation } from '@tanstack/angular-query-experimental';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { FormComponent } from '../core/guards/dirty-form-deactivator.guard';

@Component({
  selector: 'app-discount-coupons-edit',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatToolbarModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatSelectModule,
    MatRadioModule,
    MatDatepickerModule,
    MatNativeDateModule,
    ReactiveFormsModule,
  ],
  templateUrl: './discount-coupons-edit.component.html',
  styleUrl: './discount-coupons-edit.component.scss',
})
export class DiscountCouponsEditComponent implements FormComponent {
  private readonly http = inject(HttpClient);
  private readonly clubService = inject(ClubService);
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private isSubmitting = false;
  coupon = signal<DiscountCoupon | null>(null);
  form!: FormGroup;
  readonly Status = Status;

  // Query for discount coupon data
  private query = injectQuery(() => ({
    queryKey: ['discountCoupons'],
    queryFn: () => lastValueFrom(this.http.get<DiscountCoupon[]>('/discountCoupons')),
  }));

  // Query for member tags
  private tagsQuery = injectQuery(() => ({
    queryKey: ['memberTags'],
    queryFn: () => lastValueFrom(this.http.get<MemberTag[]>('/memberTags')),
  }));

  // Mutation for saving discount coupon
  saveMutation = injectMutation(() => ({
    mutationFn: (dto: Partial<DiscountCoupon>) => lastValueFrom(this.http.post<DiscountCoupon>('/discountCoupons', dto)),
    onSuccess: () => {
      this.router.navigate(['../'], { relativeTo: this.route });
    },
    onError: () => {
      this.isSubmitting = false;
    },
  }));

  constructor() {
    this.initForm();
    
    // Watch for data changes and update coupon
    effect(() => {
      const couponId = this.route.snapshot.queryParams['id'];
      const coupons = this.query.data();
      
      if (couponId && coupons) {
        const coupon = coupons.find((c) => c.id.toString() === couponId);
        if (coupon && !this.coupon()) {
          this.coupon.set(coupon);
          this.initForm();
        }
      }
    });
  }

  private initForm() {
    const coupon = this.coupon();
    const next10days = new Date();
    next10days.setDate(next10days.getDate() + 10);

    this.form = this.fb.group({
      title: new FormControl(coupon?.title || '', Validators.required),
      star: new FormControl(coupon?.star ?? -1),
      tag: new FormControl(coupon?.tag || null),
      useCode: new FormControl(coupon?.code ? true : false),
      code: new FormControl(coupon?.code || ''),
      startedAt: new FormControl(coupon?.startedAt || new Date(), Validators.required),
      expiredAt: new FormControl(coupon?.expiredAt || next10days, Validators.required),
      status: new FormControl(coupon?.status || Status.Active),
      type: new FormControl(coupon?.fixedDiscount ? 'fixed' : 'percentage'),
      fixedDiscount: new FormControl(coupon?.fixedDiscount || 0),
      percentageDiscount: new FormControl(coupon?.percentageDiscount || 0, [
        Validators.min(0), 
        Validators.max(100)
      ]),
      minPrice: new FormControl(coupon?.minPrice || 0),
      maxDiscount: new FormControl(coupon?.maxDiscount || 0),
      maxUse: new FormControl(coupon?.maxUse || null),
      maxUsePerUser: new FormControl(coupon?.maxUsePerUser || 1),
    });

    // Add conditional validators
    this.updateValidators();
  }

  private updateValidators() {
    const type = this.form.get('type')?.value;
    const useCode = this.form.get('useCode')?.value;

    if (type === 'percentage') {
      this.form.get('percentageDiscount')?.setValidators([Validators.required, Validators.min(0), Validators.max(100)]);
      this.form.get('fixedDiscount')?.setValidators([]);
    } else {
      this.form.get('fixedDiscount')?.setValidators([Validators.required, Validators.min(0)]);
      this.form.get('percentageDiscount')?.setValidators([]);
    }

    if (useCode) {
      this.form.get('code')?.setValidators([Validators.required]);
    } else {
      this.form.get('code')?.setValidators([]);
    }

    this.form.get('percentageDiscount')?.updateValueAndValidity();
    this.form.get('fixedDiscount')?.updateValueAndValidity();
    this.form.get('code')?.updateValueAndValidity();
  }

  typeChanged() {
    this.form.get('fixedDiscount')?.setValue(0);
    this.form.get('percentageDiscount')?.setValue(0);
    this.updateValidators();
  }

  useCodeChanged() {
    this.updateValidators();
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.form.value;
    
    const couponData: Partial<DiscountCoupon> = {
      id: this.coupon()?.id,
      title: formValue.title,
      star: formValue.star === -1 ? null : formValue.star,
      tag: formValue.tag,
      code: formValue.useCode ? formValue.code : null,
      startedAt: formValue.startedAt,
      expiredAt: formValue.expiredAt,
      status: formValue.status,
      fixedDiscount: formValue.type === 'fixed' ? formValue.fixedDiscount : 0,
      percentageDiscount: formValue.type === 'percentage' ? formValue.percentageDiscount : 0,
      minPrice: formValue.minPrice || 0,
      maxDiscount: formValue.maxDiscount || null,
      maxUse: formValue.maxUse || null,
      maxUsePerUser: formValue.maxUsePerUser || 1,
    };

    this.saveMutation.mutate(couponData);
  }

  canDeactivate() {
    return this.isSubmitting || !this.form.dirty;
  }
} 