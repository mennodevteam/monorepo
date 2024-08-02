import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { OrderType } from '@menno/types';
import { ShopService } from '../../../core/services/shop.service';

@Component({
  selector: 'select-order-type-card',
  templateUrl: './select-order-type-card.component.html',
  styleUrls: ['./select-order-type-card.component.scss'],
})
export class SelectOrderTypeCardComponent {
  @Input() control: FormControl;
  OrderType = OrderType;

  constructor(public shopService: ShopService) {}
}
