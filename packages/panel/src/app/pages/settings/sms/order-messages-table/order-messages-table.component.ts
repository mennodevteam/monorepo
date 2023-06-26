import { HttpClient } from '@angular/common/http';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { OrderMessage, SmsTemplate, Status } from '@menno/types';
import { MessageTemplateSelectorDialogComponent } from 'packages/panel/src/app/shared/dialogs/message-template-selector-dialog/message-template-selector-dialog.component';

@Component({
  selector: 'order-messages-table',
  templateUrl: './order-messages-table.component.html',
  styleUrls: ['./order-messages-table.component.scss'],
})
export class OrderMessagesTableComponent {
  displayedColumns = [
    'event',
    'type',
    'state',
    'payment',
    'manual',
    'template',
    'delay',
    'status',
    'actions',
  ];
  @Input() orderMessages: OrderMessage[];
  Status = Status;
  @Output() onEdit = new EventEmitter<OrderMessage>()

  constructor(private http: HttpClient, private dialog: MatDialog) {}

  async changeMessageStatus(message: OrderMessage, ev: MatSlideToggleChange) {
    let prevStatus = message.status;
    let newStatus = ev.checked ? Status.Active : Status.Inactive;
    message.status = Status.Pending;
    try {
      await this.http
        .post<OrderMessage>(`orderMessages`, {
          id: message.id,
          status: newStatus,
        })
        .toPromise();
      message.status = newStatus;
    } catch (error) {
      message.status = prevStatus;
    }
  }

  async setTemplate(message: OrderMessage) {
    const t: SmsTemplate = await this.dialog
      .open(MessageTemplateSelectorDialogComponent)
      .afterClosed()
      .toPromise();

    if (t) {
      await this.http.post('orderMessages', { id: message.id, smsTemplate: { id: t.id } }).toPromise();
      message.smsTemplate = t;
    }
  }
}
