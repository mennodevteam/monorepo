import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMMON } from '../..';
import { MatRadioModule } from '@angular/material/radio'
import { OrderType } from '@menno/types';

@Component({
  selector: 'app-order-type-bottom-sheet',
  standalone: true,
  imports: [CommonModule, COMMON, MatRadioModule],
  templateUrl: './order-type-bottom-sheet.component.html',
  styleUrl: './order-type-bottom-sheet.component.scss',
})
export class OrderTypeBottomSheetComponent {
  OrderType = OrderType;
}
