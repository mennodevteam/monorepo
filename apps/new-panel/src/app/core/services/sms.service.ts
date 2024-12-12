import { inject, Injectable } from '@angular/core';
import { NewSmsDto, Order, SmsGroup, User } from '@menno/types';
import { DialogService } from './dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { FormControl, Validators } from '@angular/forms';
import { injectMutation, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ShopService } from '../../shop/shop.service';

@Injectable({
  providedIn: 'root',
})
export class SmsService {
  private readonly dialog = inject(DialogService);
  private readonly http = inject(HttpClient);
  private readonly snack = inject(MatSnackBar);
  private readonly shopService = inject(ShopService);
  private readonly t = inject(TranslateService);
  private readonly queryClient = injectQueryClient();

  sendSmsMutation = injectMutation(() => ({
    mutationFn: (dto: Partial<NewSmsDto>) => lastValueFrom(this.http.post<SmsGroup>(`/sms/send`, dto)),
    onSuccess: (data) => {
      this.snack.open(this.t.instant('sms.sentSuccessfully'), '', { duration: 2000 });
    },
  }));

  async newSms(user: User, text?: string, order?: Order) {
    const messageText = text?.replace('@@@', User.fullName(user))
    this.dialog
      .prompt(
        this.t.instant('sms.newDialog.title', { value: User.fullName(user) }),
        {
          text: {
            label: this.t.instant('sms.newDialog.textLabel'),
            control: new FormControl(messageText, Validators.required),
            type: 'textarea',
            rows: 8,
          },
        },
        {
          config: { width: '800px' },
        },
      )
      .then((dto) => {
        if (dto.text) {
          this.sendSmsMutation.mutate({ messages: [dto.text], receptors: [user.mobilePhone] });
        }
      });
  }
}
