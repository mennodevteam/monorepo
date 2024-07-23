import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApiError } from '../../core/api-error';
import { HttpClient, HttpStatusCode } from '@angular/common/http';
import { BusinessCategory, CreateShopDto, Region } from '@menno/types';
import { RegionsService } from '../../core/services/regions.service';
import { MatomoService } from '../../core/services/matomo.service';

@Component({
  selector: 'register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  categories = Object.values(BusinessCategory);
  form!: FormGroup;
  loading = false;
  submitted = false;
  returnUrl!: string;
  hide = true;
  otpStatus: 'none' | 'sending' | 'sent' = 'none';
  otpInterval: any;
  otpTimer: any;

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private snack: MatSnackBar,
    private regionService: RegionsService,
    private http: HttpClient,
    private matomo: MatomoService
  ) {}

  get regions() {
    return this.regionService.regions;
  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      firstName: [undefined, Validators.required],
      lastName: [undefined, Validators.required],
      title: [undefined, Validators.required],
      username: [
        undefined,
        [Validators.required, Validators.minLength(3), Validators.pattern('[a-z]+[a-z0-9]*')],
      ],
      businessCategory: [undefined, Validators.required],
      loginUsername: [undefined, Validators.required],
      loginPassword: [undefined, Validators.required],
      regionId: [''],
      regionTitle: [undefined],
      mobilePhone: [undefined, [Validators.required, Validators.minLength(9), Validators.maxLength(9)]],
      otp: [undefined, Validators.required],
    });

    // get return url from route parameters or default to '/'
    this.returnUrl = '/';
  }

  async sentToken() {
    const phone = this.form.get('mobilePhone')?.value;
    if (phone && phone.length === 9) {
      this.otpStatus = 'sending';
      await this.http.get(`auth/sendToken/09${phone}`).toPromise();
      this.otpStatus = 'sent';
      this.otpTimer = 60;
      if (this.otpInterval) clearInterval(this.otpInterval);
      this.otpInterval = setInterval(() => {
        this.otpTimer--;
        if (this.otpTimer <= 0) {
          clearInterval(this.otpInterval);
          this.otpStatus = 'none';
        }
      }, 1000);
    }
  }

  async onSubmit() {
    this.submitted = true;

    // stop here if form is invalid
    if (this.form.invalid) {
      return;
    }

    const dto = this.form.getRawValue();
    dto.mobilePhone = `09${dto.mobilePhone}`;
    this.register(dto);
  }

  async register(dto: CreateShopDto) {
    this.loading = true;
    try {
      await this.http.post(`shops/register`, dto).toPromise();
      this.matomo.trackEvent('auth', 'register');

      await this.auth.login(dto.loginUsername, dto.loginPassword).toPromise();
      this.router.navigate([this.returnUrl], {
        replaceUrl: true,
      });
    } catch (error: any) {
      if (error instanceof ApiError) {
        const er: CreateShopDto = error.data;
        let errorText: string | undefined;
        if (er.otp) errorText = 'کد‌ تاییدیه وارد شده معتبر نیست';
        else if (er.loginUsername)
          errorText =
            error.status === HttpStatusCode.Conflict
              ? 'نام کاربری وارد شده تکراری است'
              : 'کد‌تاییدیه اشتباه است';
        else if (er.username)
          errorText =
            error.status === HttpStatusCode.Conflict
              ? 'شناسه وارد شده تکراری است'
              : 'شناسه وارد شده معتبر نیست';
        else if (er.mobilePhone) errorText = 'شماره تلفن وارد شده قبلا در سامانه ثبت‌نام شده است';
        if (errorText) this.snack.open(errorText);
        this.loading = false;
      }
    }
  }
}
