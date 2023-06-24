import { HttpClient } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { OrderMessage, Status } from '@menno/types';

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

  constructor(private http: HttpClient) {}

  async changeMessageStatus(message: OrderMessage, ev: MatSlideToggleChange) {
    let prevStatus = message.status;
    let newStatus = ev.checked ? Status.Active : Status.Inactive;
    message.status = Status.Pending;
    try {
      await this.http.post<OrderMessage>(`orderMessages`, {
        id: message.id,
        status: newStatus,
      }).toPromise();
      message.status = newStatus;
    } catch (error) {
      message.status = prevStatus;
    }
  }
}
