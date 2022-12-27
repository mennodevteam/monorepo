import { Component } from '@angular/core';
import { ShopService } from '../../../../core/services/shop.service';

@Component({
  selector: 'menu-toolbar',
  templateUrl: './menu-toolbar.component.html',
  styleUrls: ['./menu-toolbar.component.scss'],
})
export class MenuToolbarComponent {
  constructor(private shopService: ShopService) {}
  get shop() {
    return this.shopService.shop;
  }
}
