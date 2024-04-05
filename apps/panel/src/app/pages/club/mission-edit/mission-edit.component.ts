import { PlatformLocation } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ClubService } from '../../../core/services/club.service';
import { MemberTag, Mission, MissionConditionPeriod, MissionRewardType, Status } from '@menno/types';
import { filter, take } from 'rxjs';

@Component({
  selector: 'app-mission-edit',
  templateUrl: './mission-edit.component.html',
  styleUrls: ['./mission-edit.component.scss'],
})
export class MissionEditComponent implements OnInit {
  mission: Mission;
  form: FormGroup;
  saving: boolean;
  loading = true;
  tags: MemberTag[];
  MissionConditionPeriod = MissionConditionPeriod;
  MissionRewardType = MissionRewardType;
  MissionConditionPeriodValues = Object.values(MissionConditionPeriod);
  MissionRewardTypeValues = Object.values(MissionRewardType);

  constructor(
    private route: ActivatedRoute,
    private location: PlatformLocation,
    private club: ClubService,
    private cdr: ChangeDetectorRef
  ) {}

  ngAfterContentChecked() {
    this.cdr.detectChanges();
  }

  ngOnInit() {
    this.init();
  }

  async init() {
    const params = this.route.snapshot.queryParams;
    if (params['id']) {
      const missions = await this.club.getMissions();
      const mission = missions.find((x) => x.id.toString() === params['id']);
      if (mission) this.mission = mission;
    }

    const next30day = new Date();
    next30day.setDate(next30day.getDate() + 30);
    this.form = new FormGroup({
      title: new FormControl(this.mission?.title, Validators.required),
      description: new FormControl(this.mission?.description),
      status: new FormControl(this.mission?.status != undefined ? this.mission.status : Status.Active),
      startedAt: new FormControl(this.mission?.startedAt || new Date(), Validators.required),
      expiredAt: new FormControl(this.mission?.expiredAt || next30day, Validators.required),
      conditionPeriod: new FormControl(
        this.mission?.conditionPeriod || MissionConditionPeriod.Weekly,
        Validators.required
      ),
      orderCount: new FormControl(this.mission?.orderCount || 0),
      orderSum: new FormControl(this.mission?.orderSum || 0),
      rewardType: new FormControl(this.mission?.rewardType || MissionRewardType.DiscountCoupon),
      rewardValue: new FormControl(this.mission?.rewardValue || 0),
      durationInDays: new FormControl(this.mission?.rewardValue || 0),
      discountCoupon: new FormGroup({
        type: new FormControl('percentage'),
        fixedDiscount: new FormControl(this.mission?.rewardDetails?.fixedDiscount || 0),
        percentageDiscount: new FormControl(this.mission?.rewardDetails?.percentageDiscount || 0, [
          Validators.min(0),
          Validators.max(100),
        ]),
        minPrice: new FormControl(this.mission?.rewardDetails?.minPrice || 0),
        maxDiscount: new FormControl(this.mission?.rewardDetails?.maxDiscount || 0),
      }),
    });

    // if (this.mission) {
    //   if (this.mission.fixedDiscount) {
    //     this.form.get('type')?.setValue('fixed');
    //     this.form.get('fixedDiscount')?.setValue(this.mission.fixedDiscount);
    //   } else {
    //     this.form.get('type')?.setValue('percentage');
    //     this.form.get('percentageDiscount')?.setValue(this.mission.percentageDiscount);
    //     this.form.get('maxDiscount')?.setValue(this.mission.maxDiscount);
    //   }
    //   this.form.get('minPrice')?.setValue(this.mission.minPrice);
    //   this.form.get('status')?.setValue(this.mission.status);
    // } else {
    //   this.mission = this.missionDto;
    // }

    this.form
      .get('discountCoupon')
      ?.get('type')
      ?.valueChanges.subscribe((change) => {
        this.form.get('discountCoupon')?.get('fixedDiscount')?.setValue(0);
        this.form.get('discountCoupon')?.get('percentageDiscount')?.setValue(0);
        this.form.get('discountCoupon')?.get('minPrice')?.setValue(0);
        this.form.get('discountCoupon')?.get('maxDiscount')?.setValue(0);
        this.form.get('discountCoupon')?.get('durationInDays')?.setValue(0);
      });

    this.form.get('rewardType')?.valueChanges.subscribe((change) => {
      this.form.get('rewardValue')?.setValue(0);
      this.form.get('discountCoupon')?.get('fixedDiscount')?.setValue(0);
      this.form.get('discountCoupon')?.get('percentageDiscount')?.setValue(0);
      this.form.get('discountCoupon')?.get('minPrice')?.setValue(0);
      this.form.get('discountCoupon')?.get('maxDiscount')?.setValue(0);
      this.form.get('discountCoupon')?.get('durationInDays')?.setValue(0);
    });

    this.loading = false;
  }

  get formValue() {
    return this.form.getRawValue();
  }

  async save() {
    if (this.form.valid) {
      const dto: Mission = this.formValue;

      if (this.mission) dto.id = this.mission.id;

      if (this.isWalletChargeReward) {
        dto.rewardDetails = null;
      } else {
        dto.rewardDetails = this.formValue.discountCoupon;
      }

      this.saving = true;
      await this.club.saveMission(dto);
      this.location.back();
    }
  }

  get statusControl() {
    console.log(this.form.getRawValue());
    return this.form.get('status') as FormControl;
  }

  get isPerPurchase() {
    return this.form.getRawValue()?.conditionPeriod === MissionConditionPeriod.PerPurchase;
  }

  get isWalletChargeReward() {
    return this.form.getRawValue()?.rewardType === MissionRewardType.WalletCharge;
  }

  get isPercentageDiscount() {
    return this.form.getRawValue()?.discountCoupon.type === 'percentage';
  }
}
