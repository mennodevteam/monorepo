import { Component, Input } from '@angular/core';
import { Order } from '@menno/types';

@Component({
  selector: 'order-card',
  templateUrl: './order-card.component.html',
  styleUrls: ['./order-card.component.scss'],
})
export class OrderCardComponent {
  @Input() order: Order;

  get products() {
    return this.order?.items?.filter(x => !x.isAbstract)
  }
}
