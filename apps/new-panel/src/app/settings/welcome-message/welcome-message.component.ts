import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

import { SHARED } from '../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormComponent } from '../../core/guards/dirty-form-deactivator.guard';
import { ShopService } from '../../shop/shop.service';
import { MatCheckboxModule } from '@angular/material/checkbox';

@Component({
  selector: 'app-welcome-message',
  templateUrl: './welcome-message.component.html',
  styleUrls: ['./welcome-message.component.scss'],
  imports: [
    SHARED,
    MatCardModule,
    MatToolbarModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
  ],
  standalone: true,
})
export class WelcomeMessageComponent implements FormComponent {
  public readonly http = inject(HttpClient);
  public readonly snack = inject(MatSnackBar);
  public readonly t = inject(TranslateService);
  public readonly queryClient = injectQueryClient();
  private readonly shop = inject(ShopService);

  form = new FormGroup({
    enabled: new FormControl<boolean>(this.shop.data()?.appConfig?.welcomeMessage?.enabled ?? true),
    title: new FormControl<string>(this.shop.data()?.appConfig?.welcomeMessage?.title || '', [
      Validators.required,
    ]),
    description: new FormControl<string>(this.shop.data()?.appConfig?.welcomeMessage?.description || '', [
      Validators.required,
    ]),
    delayInSeconds: new FormControl<number>(
      this.shop.data()?.appConfig?.welcomeMessage?.delayInSeconds || 0,
      [Validators.min(0)],
    ),
  });

  constructor() {
    if (!this.shop.data()?.appConfig?.welcomeMessage?.enabled) {
      this.form.get('title')?.disable();
      this.form.get('description')?.disable();
      this.form.get('delayInSeconds')?.disable();
    }
    this.form.get('enabled')?.valueChanges.subscribe((value) => {
      if (!value) {
        this.form.get('title')?.disable();
        this.form.get('description')?.disable();
        this.form.get('delayInSeconds')?.disable();
      } else {
        this.form.get('title')?.enable();
        this.form.get('description')?.enable();
        this.form.get('delayInSeconds')?.enable();
      }
    });
  }

  saveMutation = injectMutation(() => ({
    mutationFn: (data: { welcomeMessage: { title: string; description: string; delayInSeconds?: number } }) =>
      lastValueFrom(this.http.post('/appConfigs', { welcomeMessage: data.welcomeMessage })),
    onSuccess: () => {
      this.snack.open(this.t.instant('app.savedSuccessfully'), '', { panelClass: 'success' });
      this.form.markAsPristine();
      this.queryClient.invalidateQueries({ queryKey: ['shops'] });
    },
    onError: (error) => {
      this.snack.open(this.t.instant('app.errorOccurred'), '', { panelClass: 'error' });
      console.error('Error saving welcome message settings:', error);
    },
  }));

  async save() {
    if (this.form.valid && this.form.dirty) {
      const formValue = this.form.getRawValue();
      this.saveMutation.mutate({ welcomeMessage: formValue as any });
    }
  }

  canDeactivate(): boolean {
    return !this.form.dirty;
  }
}
