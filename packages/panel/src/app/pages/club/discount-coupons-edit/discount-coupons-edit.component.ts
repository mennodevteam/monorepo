import { PlatformLocation } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ClubService } from '../../../core/services/club.service';
import { DiscountCoupon, Status } from '@menno/types';

@Component({
  selector: 'app-discount-coupons-edit',
  templateUrl: './discount-coupons-edit.component.html',
  styleUrls: ['./discount-coupons-edit.component.scss'],
})
export class DiscountCouponsEditComponent implements OnInit {
  discountCoupon: DiscountCoupon;
  form: FormGroup;
  saving: boolean;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private location: PlatformLocation,
    private club: ClubService,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterContentChecked() {
    this.cdr.detectChanges();
  }

  async ngOnInit() {
    const params = this.route.snapshot.queryParams;
    if (params['id']) {
      const discountCoupons = await this.club.getDiscountCoupons();
      const coupon = discountCoupons.find((x) => x.id === params['id']);
      if (coupon) this.discountCoupon = coupon;
    }
    const next10day = new Date();
    next10day.setDate(next10day.getDate() + 10);

    this.form = new FormGroup({
      title: new FormControl(
        this.discountCoupon ? this.discountCoupon.title : undefined,
        Validators.required
      ),
      star: new FormControl(
        this.discountCoupon ? (this.discountCoupon.star != undefined ? this.discountCoupon.star : -1) : -1
      ),
      useCode: new FormControl(this.discountCoupon && this.discountCoupon.code ? true : false),
      code: new FormControl(this.discountCoupon ? this.discountCoupon.code : undefined),
      startedAt: new FormControl(
        this.discountCoupon ? this.discountCoupon.startedAt : new Date(),
        Validators.required
      ),
      expiredAt: new FormControl(
        this.discountCoupon ? this.discountCoupon.expiredAt : next10day,
        Validators.required
      ),
      status: new FormControl(Status.Active),
      type: new FormControl('percentage'),
      fixedDiscount: new FormControl(0),
      percentageDiscount: new FormControl(0, [Validators.min(0), Validators.max(100), Validators.required]),
      minPrice: new FormControl(0),
      maxDiscount: new FormControl(undefined),
    });

    if (this.discountCoupon) {
      if (this.discountCoupon.fixedDiscount) {
        this.form.get('type')?.setValue('fixed');
        this.form.get('fixedDiscount')?.setValue(this.discountCoupon.fixedDiscount);
      } else {
        this.form.get('type')?.setValue('percentage');
        this.form.get('percentageDiscount')?.setValue(this.discountCoupon.percentageDiscount);
        this.form.get('maxDiscount')?.setValue(this.discountCoupon.maxDiscount);
      }
      this.form.get('minPrice')?.setValue(this.discountCoupon.minPrice);
      this.form.get('status')?.setValue(this.discountCoupon.status);
    } else {
      this.discountCoupon = this.discountCouponDto;
    }

    this.loading = false;
  }

  async save() {
    if (this.form.valid) {
      this.saving = true;
      const dto = this.discountCouponDto;
      await this.club.saveDiscountCoupon(dto);
      this.location.back();
    }
  }

  get discountCouponDto(): DiscountCoupon {
    const formVal = this.form.getRawValue();
    const discountCoupon = this.form.getRawValue();
    if (this.discountCoupon) discountCoupon.id = this.discountCoupon.id;
    if (discountCoupon.code) discountCoupon.star = null;
    if (discountCoupon.star === -1) discountCoupon.star = null;
    discountCoupon.startedAt = formVal.startedAt._d || formVal.startedAt;
    discountCoupon.expiredAt = formVal.expiredAt._d || formVal.expiredAt;
    discountCoupon.minPrice = formVal.minPrice || 0;
    if (!formVal.useCode) discountCoupon.code = undefined;
    return discountCoupon;
  }

  typeChanged() {
    this.form.get('fixedDiscount')?.setValue(0);
    this.form.get('percentageDiscount')?.setValue(0);
    this.form.get('minPrice')?.setValue(0);
    this.form.get('maxDiscount')?.setValue(0);
  }

  get statusControl() {
    return this.form.get('status') as FormControl;
  }
}
