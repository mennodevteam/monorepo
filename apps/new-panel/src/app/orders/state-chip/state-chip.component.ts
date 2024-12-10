import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { SHARED } from '../../shared';
import { MatMenuModule } from '@angular/material/menu';
import { OrderState } from '@menno/types';

@Component({
  selector: 'app-order-state-chip',
  standalone: true,
  imports: [CommonModule, MatChipsModule, SHARED, MatMenuModule],
  templateUrl: './state-chip.component.html',
  styleUrl: './state-chip.component.scss',
})
export class OrderStateChipComponent {
  OrderState = OrderState;
  state = input<OrderState | null | undefined>(null);
  disabled = input(false);
  stateChange = output<OrderState>();
}
