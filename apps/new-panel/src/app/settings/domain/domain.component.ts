import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { NgIcon } from '@ng-icons/core';
import { SHARED } from '../../shared';
import { ShopService } from '../../shop/shop.service';
import { environment } from '../../../environments/environment';
import { FormComponent } from '../../core/guards/dirty-form-deactivator.guard';

@Component({
  selector: 'app-domain-setting',
  standalone: true,
  imports: [
    SHARED,
    MatToolbarModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    NgIcon
  ],
  templateUrl: './domain.component.html',
  styleUrl: './domain.component.scss',
})
export class DomainSettingComponent implements OnInit, FormComponent {
  private readonly fb = inject(FormBuilder);
  readonly shopService = inject(ShopService);
  private readonly translate = inject(TranslateService);
  private readonly snack = inject(MatSnackBar);

  readonly isSaving = signal(false);

  form = this.fb.group({
    username: [
      '',
      [
        Validators.required,
        Validators.minLength(3),
        Validators.pattern(/^[a-zA-Z0-9_]+$/)
      ]
    ]
  });

  get appDomain(): string {
    const domain = environment.appDomain;
    return domain === 'localhost:4300' ? 'shottt.ir' : domain;
  }

  readonly currentSubdomainUrl = computed(() => {
    const username = this.form.controls.username.value;
    if (!username || username.length < 3) return '';
    return `https://${username.toLowerCase()}.${this.appDomain}`;
  });

  ngOnInit() {
    const shop = this.shopService.data();
    if (shop) {
      this.form.patchValue({
        username: shop.username || ''
      });
    }
  }

  canDeactivate() {
    return !this.form.dirty;
  }

  async submit() {
    if (this.form.invalid) return;

    this.isSaving.set(true);
    const dto = this.form.getRawValue();

    try {
      this.form.markAsPristine();
      const username = dto.username ? dto.username.toLowerCase() : '';
      await this.shopService.saveMutation.mutateAsync({
        username
      } as any);
    } catch (err: any) {
      this.form.markAsDirty();
      const message = err.error?.message;
      if (err.status === 409) {
        if (message === 'the username is already taken') {
          this.snack.open(this.translate.instant('domain.duplicateUsername'), '', { duration: 3000 });
        } else {
          this.snack.open(this.translate.instant('errors.changeError'), '', { duration: 3000 });
        }
      } else if (err.status === 406) {
        this.snack.open(this.translate.instant('register.notAcceptableUsername'), '', { duration: 3000 });
      } else {
        this.snack.open(this.translate.instant('errors.changeError'), '', { duration: 3000 });
      }
    } finally {
      this.isSaving.set(false);
    }
  }
}
