import { Component, inject, model, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AuthService } from '../../core/services/auth.service';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { PersianNumberService } from '@menno/utils';
import { MatButtonModule } from '@angular/material/button';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { saxArrowRight1Outline } from '@ng-icons/iconsax/outline';
import { TopAppBarComponent } from '../../shared/components/top-app-bar/top-app-bar.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    TopAppBarComponent,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    NgIcon,
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
  providers: [
    provideIcons({
      saxArrowRight1Outline,
    }),
  ],
})
export class LoginComponent {
  readonly backIcon = saxArrowRight1Outline;
  loading = signal(false);
  phone = model('');

  private auth = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  async sendToken(ev?: SubmitEvent) {
    const value = this.phone();
    if (!value || value.toString().length !== 10) return;
    const phone = `0${PersianNumberService.toEnglish(value.toString())}`;
    this.loading.set(true);

    await this.auth.sendToken(phone).toPromise();
    this.router.navigate(['/login/otp'], {
      state: { phone },
      queryParams: this.route.snapshot.queryParams,
    });

    ev?.preventDefault();
  }
}
