import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ShopService } from '../../../shop/shop.service';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { OrderType } from '@menno/types';
import { SHARED } from '../../../shared';
import { NewOrdersService } from '../new-order.service';

@Component({
  selector: 'app-order-type',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonToggleModule, SHARED],
  templateUrl: './order-type.component.html',
  styleUrl: './order-type.component.scss',
})
export class OrderTypeComponent {
  readonly service = inject(NewOrdersService);
  readonly shop = inject(ShopService);
  OrderType = OrderType;

  setType(type: OrderType) {
    if (type != undefined) {
      this.service.type.set(type);
      this.service.dirty.set(true);
    }
  }
}
