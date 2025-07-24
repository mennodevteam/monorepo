import { Component, inject, signal } from '@angular/core';

import { SHARED } from '../../shared';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { HttpClient, HttpStatusCode } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { BusinessCategory, CreateShopDto, Region, Shop, State } from '@menno/types';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { REGIONS } from '../../core/constants';
import { DialogService } from '../../core/services/dialog.service';

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
    FormsModule,
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
  private dialog = inject(DialogService);
  readonly states = Region.states(REGIONS);

  saveMutation = injectMutation(() => ({
    mutationFn: (dto: Partial<CreateShopDto>) =>
      lastValueFrom(this.http.post<Shop>(`/shops/register/v2`, dto)),
    onSuccess: async (data, dto) => {
      await this.auth.login(dto.loginUsername!, dto.loginPassword!);
      this.router.navigateByUrl('/');
    },
    onError: (err: any, newData, context) => {
      const status = err.status;
      if (status === HttpStatusCode.Forbidden) {
        this.snack.open(this.translate.instant('register.otpInvalid'), '', { duration: 2000 });
        this.verifyPhone();
      } else {
        let textKey = '';
        switch (err.status) {
          case HttpStatusCode.NotAcceptable:
            textKey = 'register.notAcceptableUsername';
            break;
          case HttpStatusCode.Conflict:
            textKey = 'register.duplicateUsername';
            break;
          default:
            textKey = 'app.error';
        }
        this.dialog.alert(this.translate.instant('app.error'), this.translate.instant(textKey), {
          config: {
            data: {
              hideCancel: true,
            },
          },
        });
        this.isLoading.set(false);
      }
    },
  }));

  registerForm = new FormGroup({
    title: new FormControl('', Validators.required),
    businessCategory: new FormControl('', Validators.required),
    loginUsername: new FormControl('', Validators.required),
    loginPassword: new FormControl('', Validators.required),
    customBusinessCategory: new FormControl(''),
    regionId: new FormControl(undefined, Validators.required),
    mobilePhone: new FormControl('', Validators.required),
  });

  isLoading = signal(false);
  selectedState = signal<State | undefined>(undefined);

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
    try {
      await this.http.get<void>(`/shops/verifyPhone/${this.registerForm.value.mobilePhone}`).toPromise();
      this.isLoading.set(false);
      this.verifyPhone();
    } catch (err: any) {
      let textKey = '';
      switch (err.status) {
        case HttpStatusCode.NotAcceptable:
          textKey = 'register.duplicateUsername';
          break;
        case HttpStatusCode.NotAcceptable:
          textKey = 'register.duplicateUsername';
          break;
        default:
          textKey = 'app.error';
      }
      this.dialog.alert(this.translate.instant('app.error'), this.translate.instant(textKey), {
        config: {
          data: {
            hideCancel: true,
          },
        },
      });
      this.isLoading.set(false);
    }
  }

  async verifyPhone() {
    this.dialog
      .prompt(
        this.translate.instant('register.otpTitle'),
        {
          otp: {
            control: new FormControl('', Validators.required),
            label: this.translate.instant('register.otpLabel'),
            eng: true,
            ltr: true,
            type: 'number',
          },
        },
        {
          description: this.translate.instant('register.otpDescription', {
            phone: this.registerForm.value.mobilePhone,
          }),
        },
      )
      .then((otp) => {
        if (otp) {
          const dto: any = { ...this.registerForm.getRawValue(), otp: otp.otp };
          this.saveMutation.mutate(dto);
        }
      });
  }
}
