import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { OrderMessage, OrderMessageEvent } from '@menno/types';
import {
  AdvancedPromptDialogComponent,
  PromptKeyFields,
} from '../../../shared/dialogs/advanced-prompt-dialog/advanced-prompt-dialog.component';
import { FormControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'sms',
  templateUrl: './sms.component.html',
  styleUrls: ['./sms.component.scss'],
})
export class SmsComponent {
  orderMessages?: OrderMessage[];

  constructor(private http: HttpClient, private translate: TranslateService, private dialog: MatDialog) {
    this.loadOrderMessages();
  }

  async loadOrderMessages() {
    this.orderMessages = undefined;
    const res = await this.http.get<OrderMessage[]>('orderMessages').toPromise();
    if (res) {
      this.orderMessages = res;
    }
  }

  openOrderMessageEditDialog(message?: OrderMessage) {
    const fields: PromptKeyFields = {
      event: {
        label: this.translate.instant('smsSettings.event'),
        control: new FormControl(message?.event, Validators.required),
        type: 'select',
        options: Object.values(OrderMessageEvent).map((e) => ({
          text: this.translate.instant(`smsSettings.eventType.${e}`),
          value: e,
        })),
      },
    };

    this.dialog.open(AdvancedPromptDialogComponent, {
      data: {
        fields,
      },
    });
  }
}
