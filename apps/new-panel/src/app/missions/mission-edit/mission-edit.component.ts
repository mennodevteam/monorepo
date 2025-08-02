import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule, PlatformLocation } from '@angular/common';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DialogService } from '../../core/services/dialog.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { Mission, MissionConditionPeriod, MissionRewardType, Status } from '@menno/types';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormComponent } from '../../core/guards/dirty-form-deactivator.guard';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { ShopService } from '../../shop/shop.service';

@Component({
  selector: 'app-mission-edit',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatToolbarModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatCardModule,
    FormsModule,
    MatSelectModule,
    MatRadioModule,
    MatDatepickerModule,
  ],
  templateUrl: './mission-edit.component.html',
  styleUrl: './mission-edit.component.scss',
})
export class MissionEditComponent implements FormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(PlatformLocation);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(DialogService);
  private readonly snack = inject(MatSnackBar);
  private readonly t = inject(TranslateService);
  private readonly http = inject(HttpClient);
  private readonly shop = inject(ShopService);
  private readonly queryClient = inject(QueryClient);

  missionId = this.route.snapshot.queryParams['id'];
  form!: FormGroup;
  mission = signal<Mission | null>(null);
  private isSubmitting = false;

  readonly MissionConditionPeriod = MissionConditionPeriod;
  readonly MissionRewardType = MissionRewardType;
  readonly MissionConditionPeriodValues = Object.values(MissionConditionPeriod);
  readonly MissionRewardTypeValues = Object.values(MissionRewardType);

  query = injectQuery(() => ({
    queryKey: ['missionList'],
    queryFn: () => lastValueFrom(this.http.get<Mission[]>(`/missions`)),
    enabled: !!this.missionId,
  }));

  saveMutation = injectMutation(() => ({
    mutationFn: (mission: Partial<Mission>) => lastValueFrom(this.http.post<Mission>(`/missions`, mission)),
    onMutate: () => {
      this.snack.open(this.t.instant('app.saving'), '', { duration: 4000 });
    },
    onSuccess: () => {
      this.snack.open(this.t.instant('app.savedSuccessfully'), '', { duration: 2000 });
      this.queryClient.invalidateQueries({ queryKey: ['missionList'] });
    },
    onError: () => {
      this.snack.open(this.t.instant('errors.changeError'), '', { duration: 2000 });
    },
  }));

  constructor() {
    if (this.missionId && this.query.data()) {
      const mission = this.query.data()?.find((m) => m.id.toString() === this.missionId);
      this.mission.set(mission || null);
    }

    const next30day = new Date();
    next30day.setDate(next30day.getDate() + 30);

    this.form = this.fb.group({
      title: new FormControl(this.mission()?.title, Validators.required),
      description: new FormControl(this.mission()?.description),
      status: new FormControl(this.mission()?.status ?? Status.Active),
      startedAt: new FormControl(this.mission()?.startedAt || new Date(), Validators.required),
      expiredAt: new FormControl(this.mission()?.expiredAt || next30day, Validators.required),
      conditionPeriod: new FormControl(
        this.mission()?.conditionPeriod || MissionConditionPeriod.Weekly,
        Validators.required,
      ),
      orderCount: new FormControl(this.mission()?.orderCount || 0),
      orderSum: new FormControl(this.mission()?.orderSum || 0),
      rewardType: new FormControl(this.mission()?.rewardType || MissionRewardType.DiscountCoupon),
      rewardValue: new FormControl(this.mission()?.rewardValue || 0),
      percentageRewardValue: new FormControl(this.mission()?.percentageRewardValue || 0),
      durationInDays: new FormControl(this.mission()?.durationInDays || 0),
      discountCoupon: this.fb.group({
        type: new FormControl('percentage'),
        fixedDiscount: new FormControl(this.mission()?.rewardDetails?.fixedDiscount || 0),
        percentageDiscount: new FormControl(this.mission()?.rewardDetails?.percentageDiscount || 0, [
          Validators.min(0),
          Validators.max(100),
        ]),
        minPrice: new FormControl(this.mission()?.rewardDetails?.minPrice || 0),
        maxDiscount: new FormControl(this.mission()?.rewardDetails?.maxDiscount || 0),
      }),
    });

    // Update form when mission data is loaded
    effect(() => {
      if (this.query.data() && this.missionId) {
        const mission = this.query.data()?.find((m) => m.id.toString() === this.missionId);
        if (mission) {
          this.mission.set(mission);
          this.form.patchValue({
            title: mission.title,
            description: mission.description,
            status: mission.status,
            startedAt: mission.startedAt,
            expiredAt: mission.expiredAt,
            conditionPeriod: mission.conditionPeriod,
            orderCount: mission.orderCount,
            orderSum: mission.orderSum,
            rewardType: mission.rewardType,
            rewardValue: mission.rewardValue,
            durationInDays: mission.durationInDays,
            discountCoupon: {
              type: mission.rewardDetails?.percentageDiscount ? 'percentage' : 'fixed',
              fixedDiscount: mission.rewardDetails?.fixedDiscount || 0,
              percentageDiscount: mission.rewardDetails?.percentageDiscount || 0,
              minPrice: mission.rewardDetails?.minPrice || 0,
              maxDiscount: mission.rewardDetails?.maxDiscount || 0,
            },
          });
        }
      }
    });

    // Reset form values when reward type changes
    this.form.get('rewardType')?.valueChanges.subscribe((change) => {
      this.form.get('rewardValue')?.setValue(0);
      this.form.get('discountCoupon')?.get('fixedDiscount')?.setValue(0);
      this.form.get('discountCoupon')?.get('percentageDiscount')?.setValue(0);
      this.form.get('discountCoupon')?.get('minPrice')?.setValue(0);
      this.form.get('discountCoupon')?.get('maxDiscount')?.setValue(0);
      this.form.get('durationInDays')?.setValue(0);
    });

    // Reset discount coupon form when type changes
    this.form
      .get('discountCoupon')
      ?.get('type')
      ?.valueChanges.subscribe((change) => {
        this.form.get('discountCoupon')?.get('fixedDiscount')?.setValue(0);
        this.form.get('discountCoupon')?.get('percentageDiscount')?.setValue(0);
        this.form.get('discountCoupon')?.get('minPrice')?.setValue(0);
        this.form.get('discountCoupon')?.get('maxDiscount')?.setValue(0);
      });
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.form.value;

    const missionData: Partial<Mission> = {
      id: this.mission()?.id,
      ...formValue,
      club: { id: this.shop.data()?.club?.id },
      rewardDetails: this.isWalletChargeReward ? null : formValue.discountCoupon,
    };

    this.saveMutation.mutate(missionData);
    this.router.navigate(['../'], { relativeTo: this.route });
    this.isSubmitting = false;
  }

  canDeactivate() {
    return this.isSubmitting || !this.form?.dirty;
  }

  get isPerPurchase() {
    return this.form.get('conditionPeriod')?.value === MissionConditionPeriod.PerPurchase;
  }

  get isWalletChargeReward() {
    return this.form.get('rewardType')?.value === MissionRewardType.WalletCharge;
  }

  get isPercentageDiscount() {
    return this.form.get('discountCoupon')?.get('type')?.value === 'percentage';
  }
}
