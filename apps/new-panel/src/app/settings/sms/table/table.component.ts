import { Component, input, output } from '@angular/core';

import { OrderMessage, Status } from '@menno/types';
import { SHARED } from '../../../shared';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatMenuModule } from '@angular/material/menu';

const COLS = ['event', 'state', 'template', 'status', 'actions'];

@Component({
  selector: 'app-order-messages-table',
  standalone: true,
  imports: [SHARED, MatTableModule, MatChipsModule, MatMenuModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
})
export class OrderMessagesTableComponent {
  Status = Status;
  displayedColumns = COLS;
  messages = input<OrderMessage[] | undefined>();
  statusChange = output<{ message: OrderMessage; status: Status }>();
  editClick = output<OrderMessage>();
  setTemplateClick = output<OrderMessage>();
}
