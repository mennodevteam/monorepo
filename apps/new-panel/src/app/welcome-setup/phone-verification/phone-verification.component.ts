import { Component, inject, signal, OnDestroy } from '@angular/core';
import { SHARED } from '../../shared';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient, HttpStatusCode } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PersianNumberService } from '@menno/utils';
import { AuthService } from '../../auth/auth.service';
import { ShopService } from '../../shop/shop.service';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

import { DialogService } from '../../core/services/dialog.service';

enum VerificationStep {
  PHONE = 'phone',
  OTP = 'otp',
}

@Component({
  selector: 'app-phone-verification',
  standalone: true,
  imports: [
    SHARED,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatButtonModule,
    MatInputModule
],
  templateUrl: './phone-verification.component.html',
  styleUrl: './phone-verification.component.scss',
})
export class PhoneVerificationComponent implements OnDestroy {
  private http = inject(HttpClient);
  private snack = inject(MatSnackBar);
  private router = inject(Router);
  private translate = inject(TranslateService);
  private auth = inject(AuthService);
  public shop = inject(ShopService);
  private dialog = inject(DialogService);

  phoneForm = new FormGroup({
    phone: new FormControl('', [Validators.required, Validators.pattern(/^09\d{9}$/)]),
  });

  otpForm = new FormGroup({
    otp: new FormControl('', [Validators.required, Validators.pattern(/^\d{4}$/)]),
  });

  currentStep = signal<VerificationStep>(VerificationStep.PHONE);
  isLoading = signal(false);
  countdown = signal(60);
  canResend = signal(false);
  phone: string = '';

  private countdownInterval?: any;
  VerificationStep = VerificationStep;

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  saveMutation = injectMutation(() => ({
    mutationFn: (phone: string) => lastValueFrom(this.http.get<void>(`/shops/verifyPhone/${phone}`)),
    onMutate: (phone: string) => {
      this.phoneForm.get('phone')?.disable();
      this.isLoading.set(true);
    },
    onSuccess: async (data, phone) => {
      this.phone = phone;
      this.currentStep.set(VerificationStep.OTP);
      this.startCountdown();
      this.isLoading.set(false);
    },
    onError: (err: any, newData, context) => {
      this.phoneForm.get('phone')?.enable();
      if (err.status === HttpStatusCode.Conflict) {
        this.dialog.alert(
          this.translate.instant('app.error'),
          this.translate.instant('welcome.phone.phoneAlreadyExists'),
          {
            config: {
              data: {
                hideCancel: true,
              },
            },
          },
        );
      }
      this.isLoading.set(false);
    },
  }));

  async submitPhone() {
    if (this.phoneForm.invalid) return;

    const phone = PersianNumberService.toEnglish(this.phoneForm.value.phone!);
    this.saveMutation.mutateAsync(phone);
  }

  async verifyOtp() {
    if (this.otpForm.invalid) return;

    const otp = PersianNumberService.toEnglish(this.otpForm.value.otp!);
    this.isLoading.set(true);

    try {
      // Verify the OTP with the backend
      const result = await this.http
        .get(`/auth/login/app/v2/${this.auth.user?.id}/${this.phone}/${otp}`)
        .toPromise();

      if (result) {
        this.snack.open(this.translate.instant('otp.verificationSuccess'), '', { duration: 3000 });

        // Navigate to next step in welcome setup
        this.router.navigate(['/welcome/next-step']);
      }
    } catch (error) {
      this.snack.open(this.translate.instant('otp.verificationFailed'), '', { duration: 3000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  async resendCode() {
    if (!this.canResend()) return;

    this.isLoading.set(true);
    try {
      await this.http.get(`/auth/sendToken/${this.phone}`).toPromise();

      this.snack.open(this.translate.instant('otp.codeResent'), '', { duration: 3000 });

      this.startCountdown();
    } catch (error) {
      this.snack.open(this.translate.instant('otp.errorResending'), '', { duration: 3000 });
    } finally {
      this.isLoading.set(false);
    }
  }

  goBackToPhone() {
    this.currentStep.set(VerificationStep.PHONE);
    this.phoneForm.get('phone')?.enable();
    this.otpForm.reset();
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  private startCountdown() {
    this.countdown.set(60);
    this.canResend.set(false);

    this.countdownInterval = setInterval(() => {
      this.countdown.update((value) => {
        if (value <= 1) {
          clearInterval(this.countdownInterval);
          this.canResend.set(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
  }
}
