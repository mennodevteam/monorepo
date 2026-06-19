import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AiChatbot, Status } from '@menno/types';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';

import { SHARED } from '../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
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
    MatButtonModule,
  ],
  standalone: true,
})
export class AiChatbotComponent implements FormComponent {
  public readonly http = inject(HttpClient);
  public readonly snack = inject(MatSnackBar);
  public readonly t = inject(TranslateService);
  public readonly queryClient = injectQueryClient();
  readonly shop = inject(ShopService);

  Status = Status;

  form = new FormGroup({
    active: new FormControl<boolean>(this.shop.data()?.aiChatbot?.status === Status.Active),
    style: new FormControl<string>(this.shop.data()?.aiChatbot?.style || ''),
    extraInfo: new FormControl<string>(this.shop.data()?.aiChatbot?.extraInfo || ''),
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
      const { active, style, extraInfo } = this.form.getRawValue();
      const payload: Partial<AiChatbot> = {
        status: active ? Status.Active : Status.Inactive,
        style: style || '',
        extraInfo: extraInfo || '',
      };
      this.saveMutation.mutate(payload);
    }
  }

  canDeactivate(): boolean {
    return !this.form.dirty;
  }
}
