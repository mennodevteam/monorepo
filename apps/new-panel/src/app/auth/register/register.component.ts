import { Component, inject, signal } from '@angular/core';

import { SHARED } from '../../shared';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { BusinessCategory, CreateShopDto, Shop } from '@menno/types';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

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
    RouterModule,
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

  saveMutation = injectMutation(() => ({
    mutationFn: (dto: Partial<CreateShopDto>) =>
      lastValueFrom(this.http.post<Shop>(`/shops/register/v2`, dto)),
    onSuccess: async (data, dto) => {
      await this.auth.login(dto.loginUsername!, dto.loginPassword!);
      this.router.navigateByUrl('/');
    },
    onError: (err, newData, context) => {
      // this.snack.open(this.t.instant('errors.changeError'), '', { duration: 2000 });
      // this.queryClient.setQueryData(QUERY_KEY, context?.previousData);
    },
  }));

  registerForm = new FormGroup({
    title: new FormControl('', Validators.required),
    businessCategory: new FormControl('', Validators.required),
    loginUsername: new FormControl('', Validators.required),
    loginPassword: new FormControl('', Validators.required),
    customBusinessCategory: new FormControl(''),
  });

  isLoading = signal(false);

  businessCategories = Object.values(BusinessCategory);
  BusinessCategory = BusinessCategory;

  constructor() {
    this.registerForm.get('shopCategory')?.valueChanges.subscribe((value) => {
      if (value === BusinessCategory.Other) {
        this.registerForm.get('customBusinessCategory')?.setValidators([Validators.required]);
      } else {
        this.registerForm.get('customBusinessCategory')?.clearValidators();
      }
    });
  }

  async submit() {
    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    const formData: any = this.registerForm.getRawValue();
    this.saveMutation.mutate(formData);
  }
}
