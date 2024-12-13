import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { injectMutation, injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { OrderMessage, OrderMessageEvent, OrderState, SmsTemplate } from '@menno/types';
import { OrderMessagesTableComponent } from './table/table.component';
import { DialogService } from '../../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { FormControl, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { SmsService } from '../../core/services/sms.service';

@Component({
  selector: 'app-sms',
  standalone: true,
  imports: [CommonModule, SHARED, MatToolbarModule, MatCardModule, OrderMessagesTableComponent],
  templateUrl: './sms.component.html',
  styleUrl: './sms.component.scss',
})
export class AutoSmsSettingComponent {
  private readonly http = inject(HttpClient);
  private readonly snack = inject(MatSnackBar);
  private readonly sms = inject(SmsService);
  private readonly queryClient = injectQueryClient();
  private readonly t = inject(TranslateService);
  private readonly dialog = inject(DialogService);
  query = injectQuery(() => ({
    queryKey: ['orderMessages'],
    queryFn: () => lastValueFrom(this.http.get<OrderMessage[]>('/orderMessages')),
  }));

  saveMutation = injectMutation(() => ({
    mutationFn: (dto: Partial<OrderMessage>) =>
      lastValueFrom(this.http.post<OrderMessage>(`/orderMessages`, dto)),
    onMutate: (dto) => {
      this.queryClient.cancelQueries({ queryKey: ['orderMessages'] });
      const previousData = this.queryClient.getQueryData<OrderMessage[]>(['orderMessages']);
      this.queryClient.setQueryData(['orderMessages'], (old: OrderMessage[]) => {
        if (dto.id) {
          const item = old.find((x) => x.id === dto.id);
          if (item) {
            Object.assign(item, dto);
            return [...old];
          }
        } else {
          return [...old, dto];
        }
        return old;
      });

      return { previousData };
    },
    onError: (err, newData, context) => {
      this.snack.open('خطا در تغییر وضعیت', '', { duration: 2000 });
      this.queryClient.setQueryData(['orders'], context?.previousData);
    },
  }));

  editDialog(orderMessage?: OrderMessage) {
    this.dialog
      .prompt(this.t.instant(`orderMessagesSetting.${orderMessage ? 'editTitle' : 'addTitle'}`), {
        event: {
          label: this.t.instant('orderMessagesSetting.event'),
          control: new FormControl(orderMessage?.event, Validators.required),
          type: 'select',
          options: Object.values(OrderMessageEvent).map((x) => ({
            value: x,
            text: this.t.instant('orderMessagesSetting.eventType.' + x),
          })),
        },
        state: {
          label: this.t.instant('orderMessagesSetting.orderState'),
          control: new FormControl(orderMessage?.state, Validators.required),
          type: 'select',
          options: Object.values(OrderState).map((x) => ({
            value: x,
            text: this.t.instant('order.state.' + x),
          })),
        },
      })
      .then(async (dto) => {
        if (dto) {
          if (orderMessage) dto.id = orderMessage.id;
          else {
            const template = await this.sms.newTemplate();
            if (!template) return;
            dto.smsTemplate = template;
          }
          this.saveMutation.mutate(dto);
        }
      });
  }

  async setTemplate(message: OrderMessage) {
    const smsTemplate = await this.sms.newTemplate();
    if (smsTemplate) this.saveMutation.mutate({ id: message.id, smsTemplate });
  }
}
