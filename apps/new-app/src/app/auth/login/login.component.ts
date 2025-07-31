import { Component, signal } from '@angular/core';

import { COMMON } from '../../common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TopAppBarComponent } from '../../common/components';
import { AuthService } from '../../core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { PersianNumberService } from '@menno/utils';
import { AnalyticsService } from '../../core/services/analytics.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    COMMON,
    TopAppBarComponent,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loading = signal(false);
  phoneControl = new FormControl<string | number | undefined>(undefined, [
    Validators.required,
    Validators.max(9999999999),
  ]);

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private analytics: AnalyticsService,
  ) {}

  async sendToken(ev?: SubmitEvent) {
    const value = this.phoneControl.value;
    if (!value || value.toString().length !== 10) return;
    const phone = `0${PersianNumberService.toEnglish(value.toString())}`;
    this.loading.set(true);
    
    // Track login attempt
    this.analytics.trackEvent('login_attempted', {
      phone: phone,
      returnPath: this.route.snapshot.queryParams['returnPath']
    });
    
    await this.auth.sendToken(phone).toPromise();
    this.router.navigate(['/login/otp'], {
      state: { phone },
      queryParams: this.route.snapshot.queryParams,
    });
    ev?.preventDefault();
  }
}
