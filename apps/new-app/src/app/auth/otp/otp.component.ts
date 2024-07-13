import { Component, OnDestroy, signal } from '@angular/core';
import { CommonModule, PlatformLocation } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core';
import { COMMON } from '../../common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { TopAppBarComponent } from '../../common/components';
import { PersianNumberService } from '@menno/utils';

const SYSTEM_KEYS = ['Tab', 'Shift', 'Enter', 'Space'];

@Component({
  selector: 'app-otp',
  standalone: true,
  imports: [CommonModule, COMMON, MatInputModule, MatFormFieldModule, FormsModule, TopAppBarComponent],
  templateUrl: './otp.component.html',
  styleUrl: './otp.component.scss',
})
export class OtpComponent implements OnDestroy {
  time = signal(60);
  phone: string;
  loading = signal(false);
  interval?: any;

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private location: PlatformLocation,
    private router: Router,
  ) {
    const phone = this.route.snapshot.queryParamMap.get('phone');
    if (!phone) {
      location.back();
      return;
    }

    this.phone = phone;
    this.resetTimer();
  }

  async setToken(token: string, ev?: Event) {
    this.loading.set(true);
    token = PersianNumberService.toEnglish(token);
    try {
      await this.auth.loginWithToken(this.phone, token);
      this.router.navigate(['/']);
    } catch (error) {
      //
    }
    ev?.preventDefault();
  }

  nextFocus(ev: KeyboardEvent, nextElement: HTMLInputElement) {
    if (SYSTEM_KEYS.indexOf(ev.key) === -1) {
      nextElement.select();
    }
  }

  resetTimer() {
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
