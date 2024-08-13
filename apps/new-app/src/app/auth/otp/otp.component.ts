import { Component, ElementRef, OnDestroy, ViewChild, effect, signal } from '@angular/core';
import { CommonModule, PlatformLocation } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core';
import { COMMON } from '../../common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TopAppBarComponent } from '../../common/components';
import { PersianNumberService } from '@menno/utils';
import { NgOtpInputComponent, NgOtpInputModule } from 'ng-otp-input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [
    CommonModule,
    COMMON,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    TopAppBarComponent,
    ReactiveFormsModule,
    NgOtpInputModule,
    MatSnackBarModule,
  ],
  templateUrl: './otp.component.html',
  styleUrl: './otp.component.scss',
})
export class OtpComponent implements OnDestroy {
  time = signal(60);
  phone: string;
  loading = signal(false);
  error = signal(false);
  interval?: any;
  otpFormControl = new FormControl();
  prevValue: string;
  @ViewChild(NgOtpInputComponent) inputComponent: NgOtpInputComponent;

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private location: PlatformLocation,
    private router: Router,
    private snack: MatSnackBar,
    private translate: TranslateService,
  ) {
    const phone = this.router.getCurrentNavigation()?.extras?.state?.['phone'];

    if (!phone) {
      router.navigate(['/login'], { replaceUrl: true });
      return;
    }

    this.phone = phone;
    this.resetTimer();

    this.otpFormControl.valueChanges.subscribe((value) => {
      this.error.set(false);
      if (value.length === 4 && this.prevValue?.length !== 4) this.setToken(value);
      this.prevValue = value;
    });
  }

  async setToken(ev?: Event) {
    const returnPath = this.route.snapshot.queryParams?.['returnPath'];
    this.loading.set(true);
    const token = PersianNumberService.toEnglish(this.otpFormControl.value);
    try {
      const user = await this.auth.loginWithToken(this.phone, token);
      if (user?.firstName) {
        window.history.go(-2);
        setTimeout(() => {
          if (returnPath) {
            this.router.navigate([returnPath]);
          }
        }, 100);
      } else {
        window.history.go(-2);
        setTimeout(() => {
          this.router.navigate(['/login/register'], {
            queryParams: this.route.snapshot.queryParams,
          });
        }, 100);
      }
    } catch (error) {
      this.error.set(true);
      this.snack.open(this.translate.instant('login.otpError'), '', { duration: 2000 });
      this.loading.set(false);
    }
    ev?.preventDefault?.();
  }

  resetTimer() {
    this.time.set(60);
    this.inputComponent?.setValue(null);
    this.error.set(false);
    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => {
      this.time.update((prev) => {
        if (prev > 0) return prev - 1;
        return 0;
      });
    }, 1000);
  }

  async sendTokenAgain() {
    if (!this.time()) {
      this.loading.set(true);
      await this.auth.sendToken(this.phone).toPromise();
      this.loading.set(false);
      this.resetTimer();
    }
  }

  ngOnDestroy(): void {
    if (this.interval) clearInterval(this.interval);
  }
}
