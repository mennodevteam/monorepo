import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import {
  OrderMessage,
  OrderMessageEvent,
  OrderPaymentType,
  OrderState,
  OrderType,
  SmsTemplate,
} from '@menno/types';
import {
  AdvancedPromptDialogComponent,
  PromptKeyFields,
} from '../../../shared/dialogs/advanced-prompt-dialog/advanced-prompt-dialog.component';
import { FormControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { MessageTemplateService } from '../../../core/services/messageTemplate.service';
import { MessageTemplateSelectorDialogComponent } from '../../../shared/dialogs/message-template-selector-dialog/message-template-selector-dialog.component';

@Component({
  selector: 'sms',
  templateUrl: './sms.component.html',
  styleUrls: ['./sms.component.scss'],
})
export class SmsComponent {
  orderMessages?: OrderMessage[];

  constructor(
    private http: HttpClient,
    private translate: TranslateService,
    private dialog: MatDialog,
    private templatesService: MessageTemplateService
  ) {
    this.loadOrderMessages();
  }

  async loadOrderMessages() {
    this.orderMessages = undefined;
    const res = await this.http.get<OrderMessage[]>('orderMessages').toPromise();
    if (res) {
      this.orderMessages = res;
    }
  }

  async openOrderMessageEditDialog(message?: OrderMessage) {
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
      type: {
        label: this.translate.instant('smsSettings.orderType'),
        control: new FormControl(message?.type),
        type: 'select',
        options: [
          { value: null, text: this.translate.instant('app.all') },
          { value: OrderType.DineIn, text: this.translate.instant('orderType.dineIn') },
          { value: OrderType.Delivery, text: this.translate.instant('orderType.delivery') },
          { value: OrderType.Takeaway, text: this.translate.instant('orderType.takeaway') },
        ],
      },
      state: {
        label: this.translate.instant('smsSettings.orderState'),
        control: new FormControl(message?.state),
        type: 'select',
        options: [
          { value: null, text: this.translate.instant('app.all') },
          { value: OrderState.Processing, text: this.translate.instant('orderState.processing') },
          { value: OrderState.Ready, text: this.translate.instant('orderState.ready') },
          { value: OrderState.Shipping, text: this.translate.instant('orderState.shipping') },
          { value: OrderState.Completed, text: this.translate.instant('orderState.completed') },
          { value: OrderState.Canceled, text: this.translate.instant('orderState.canceled') },
        ],
      },
      isManual: {
        label: `${this.translate.instant('smsSettings.orderManual')}/${this.translate.instant(
          'smsSettings.orderNotManual'
        )}`,
        control: new FormControl(message?.isManual),
        type: 'select',
        options: [
          { value: null, text: this.translate.instant('app.all') },
          { value: true, text: this.translate.instant('smsSettings.orderManual') },
          { value: false, text: this.translate.instant('smsSettings.orderNotManual') },
        ],
      },
      delayInMinutes: {
        label: this.translate.instant('smsSettings.delay'),
        control: new FormControl(message?.delayInMinutes),
        type: 'number',
      },
    };

    this.dialog
      .open(AdvancedPromptDialogComponent, {
        data: {
          fields,
        },
        width: '600px',
        disableClose: true,
      })
      .afterClosed()
      .subscribe(async (dto: OrderMessage) => {
        if (dto) {
          if (message) dto.id = message.id;
          if (!dto.delayInMinutes) dto.delayInMinutes = 0;
          const saved = await this.http.post('orderMessages', dto).toPromise();
          if (saved) {
            this.loadOrderMessages();
          }
        }
      });
  }
}
