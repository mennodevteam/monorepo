import { Component } from '@angular/core';
import { ShopService } from '../../../core/services/shop.service';

@Component({
  selector: 'shop-welcome',
  templateUrl: './shop-welcome.component.html',
  styleUrls: ['./shop-welcome.component.scss'],
})
export class ShopWelcomeComponent {
  constructor(private shopService: ShopService){}

  get shop() {
    return this.shopService.shop;
  }
}
