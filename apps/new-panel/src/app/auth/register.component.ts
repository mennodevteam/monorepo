import { Component, inject, signal } from '@angular/core';

import { SHARED } from '../shared';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from './auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    SHARED,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    RouterModule
],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private auth = inject(AuthService);
  private snack = inject(MatSnackBar);
  private router = inject(Router);
  private http = inject(HttpClient);
  private translate = inject(TranslateService);
  
  registerForm = new FormGroup({
    shopTitle: new FormControl('', Validators.required),
    shopCategory: new FormControl('', Validators.required),
    managerFirstName: new FormControl('', Validators.required),
    managerLastName: new FormControl('', Validators.required),
    managerPhone: new FormControl('', [
      Validators.required,
      Validators.pattern(/^09\d{9}$/)
    ]),
  });
  
  isLoading = signal(false);

  shopCategories = [
    { value: 'CAFE', label: 'کافی شاپ' },
    { value: 'RESTAURANT', label: 'رستوران' },
    { value: 'CAFE_RESTAURANT', label: 'کافه‌رستوران' },
    { value: 'PROTEIN', label: 'پروتئین' },
    { value: 'CONFECTIONARY', label: 'شیرینی' },
    { value: 'GAME_CAFE', label: 'کافه بازی' },
    { value: 'JUICE_AND_ICE_CREAM', label: 'آبمیوه و بستنی' },
    { value: 'HERBAL', label: 'عطاری' },
    { value: 'NUTS', label: 'آجیل و خشکبار' },
    { value: 'FRUITS', label: 'میوه' },
    { value: 'OTHER', label: 'سایر' },
  ];

  async submit() {
    if (this.registerForm.invalid) return;
    
    this.isLoading.set(true);
    try {
      const formData = this.registerForm.getRawValue();
      await this.http.post('/auth/register/send-otp', formData).toPromise();
      
      this.snack.open(this.translate.instant('register.otpSent'), '', {
        duration: 3000,
      });
      
      // Navigate to OTP verification page or show OTP input
      // this.router.navigateByUrl('/auth/verify-otp');
      
    } catch (error) {
      this.snack.open(this.translate.instant('register.error'), '', {
        duration: 3000,
      });
    } finally {
      this.isLoading.set(false);
    }
  }
} 