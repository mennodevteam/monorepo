import { Component, OnDestroy, signal, inject, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { TopAppBarComponent } from '../../shared/components/top-app-bar/top-app-bar.component';
import { PersianNumberService } from '@menno/utils';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    TopAppBarComponent,
    MatSnackBarModule,
    MatButtonModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './otp.component.html',
  styleUrl: './otp.component.scss',
})
export class OtpComponent implements OnDestroy {
  time = signal(60);
  phone: string;
  loading = signal(false);
  error = signal(false);
  interval?: ReturnType<typeof setInterval>;
  otp = model('');

  private route = inject(ActivatedRoute);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  constructor() {
    const phone = this.router.getCurrentNavigation()?.extras?.state?.['phone'];

    if (!phone) {
      this.router.navigate(['/login'], { replaceUrl: true });
      this.phone = ''; // Initialize to avoid error
      return;
    }

    this.phone = phone;
    this.resetTimer();

  }

  async setToken(ev?: Event) {
    if (this.loading()) {
      ev?.preventDefault?.();
      return;
    }

    const returnPath = this.route.snapshot.queryParams?.['returnPath'];
    const value = this.otp()?.trim();
    this.error.set(false);
    if (value) {
      this.loading.set(true);
      const token = PersianNumberService.toEnglish(value.toString());
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
      } catch (error: unknown) {
        this.error.set(true);
        this.loading.set(false);
        if (error && typeof error === 'object' && 'status' in error && error.status === 403) {
          this.snack.open('کد وارد شده صحیح نیست', '', { duration: 2000 });
        } else if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
          this.snack.open(error.message, '', { duration: 6000 });
        } else {
          this.snack.open('خطایی رخ داد', '', { duration: 6000 });
        }
      }
    }
    ev?.preventDefault?.();
  }

  hasOtpValue() {
    const value = this.otp();
    return typeof value === 'string' && value.trim().length > 0;
  }

  resetTimer() {
    this.time.set(60);
    this.otp.set('');
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
