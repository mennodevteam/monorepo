import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMMON } from '../../common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { TopAppBarComponent } from '../../common/components';
import { AuthService } from '../../core';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router } from '@angular/router';
import { PersianNumberService } from '@menno/utils';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    COMMON,
    TopAppBarComponent,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  loading = signal(false);

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  async sendToken(phone: string, ev: SubmitEvent) {
    if (phone.length !== 9) return;
    phone = PersianNumberService.toEnglish(phone);
    this.loading.set(true);
    await this.auth.sendToken(`09${phone}`).toPromise();
    this.router.navigate(['/login/otp'], { queryParams: { phone: `09${phone}` } });
    ev.preventDefault();
  }
}
