import { Component } from '@angular/core';
import { MenuService } from '../../../core/services/menu.service';
import { ShopService } from '../../../core/services/shop.service';

@Component({
  selector: 'shop-home',
  templateUrl: './shop-home.component.html',
  styleUrls: ['./shop-home.component.scss'],
})
export class ShopHomeComponent {
  constructor(private shopService: ShopService, private menuService: MenuService) {}

  get shop() {
    return this.shopService.shop;
  }
}
