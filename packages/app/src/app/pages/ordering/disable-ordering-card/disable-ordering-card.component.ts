import { Component } from '@angular/core';
import { ShopService } from '../../../core/services/shop.service';

@Component({
  selector: 'disable-ordering-card',
  templateUrl: './disable-ordering-card.component.html',
  styleUrls: ['./disable-ordering-card.component.scss'],
})
export class DisableOrderingCardComponent {
  constructor(private shopService: ShopService){}

  get appConfig() {
    return this.shopService.shop?.appConfig;
  }

  get isClosed() {
    return !this.shopService.isOpen;
  }
}
