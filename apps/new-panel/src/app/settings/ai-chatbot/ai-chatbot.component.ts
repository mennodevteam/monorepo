import { Component, effect, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AiChatbot, Status } from '@menno/types';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { injectMutation, injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

import { SHARED } from '../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormComponent } from '../../core/guards/dirty-form-deactivator.guard';
import { ShopService } from '../../shop/shop.service';

@Component({
  selector: 'app-ai-chatbot',
  templateUrl: './ai-chatbot.component.html',
  styleUrls: ['./ai-chatbot.component.scss'],
  imports: [
    SHARED,
    MatCardModule,
    MatToolbarModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
  ],
  standalone: true,
})
export class AiChatbotComponent implements FormComponent {
  public readonly http = inject(HttpClient);
  public readonly snack = inject(MatSnackBar);
  public readonly t = inject(TranslateService);
  public readonly queryClient = injectQueryClient();
  private readonly shop = inject(ShopService);

  Status = Status;

  form = new FormGroup({
    status: new FormControl<Status>(this.shop.data()?.aiChatbot?.status || Status.Inactive),
    style: new FormControl<string>(this.shop.data()?.aiChatbot?.style || ''),
    extraInfo: new FormControl<string>(this.shop.data()?.aiChatbot?.extraInfo || ''),
    introMessage: new FormControl<string>(this.shop.data()?.aiChatbot?.introMessage || ''),
  });

  saveMutation = injectMutation(() => ({
    mutationFn: (data: Partial<AiChatbot>) => lastValueFrom(this.http.put<AiChatbot>('/ai-chatbot', data)),
    onSuccess: () => {
      this.snack.open(this.t.instant('app.savedSuccessfully'), '', { panelClass: 'success' });
      this.form.markAsPristine();
      this.queryClient.invalidateQueries({ queryKey: ['shops'] });
    },
    onError: (error) => {
      this.snack.open(this.t.instant('app.errorOccurred'), '', { panelClass: 'error' });
      console.error('Error saving AI chatbot settings:', error);
    },
  }));

  async save() {
    if (this.form.valid && this.form.dirty) {
      const formValue = this.form.getRawValue() as any;
      this.saveMutation.mutate(formValue);
    }
  }

  canDeactivate(): boolean {
    return !this.form.dirty;
  }
}
