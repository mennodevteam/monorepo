import { Component } from '@angular/core';
import { ShopService } from '../../core/services/shop.service';
import { HomePage, OrderType } from '@menno/types';
import { ActivatedRoute } from '@angular/router';
import { MenuService } from '../../core/services/menu.service';
import { BasketService } from '../../core/services/basket.service';

@Component({
  selector: 'ordering',
  templateUrl: './ordering.component.html',
  styleUrls: ['./ordering.component.scss'],
})
export class OrderingComponent {
  HomePage = HomePage;
  constructor(
    private shopService: ShopService,
    private route: ActivatedRoute,
    private menuService: MenuService,
    private basket: BasketService
  ) {
    const params = this.route.snapshot.queryParams;
    if (params['table']) {
      this.menuService.type = OrderType.DineIn;
      this.basket.details = { ...this.basket.details, table: params['table'] };
    } else if (params['type']) {
      switch (params['type'].toLowerCase()) {
        case 'delivery':
          this.menuService.type = OrderType.Delivery;
          break;
        case 'dinein':
          this.menuService.type = OrderType.DineIn;
          break;
        case 'takeaway':
          this.menuService.type = OrderType.Takeaway;
          break;
      }
    }
  }

  get homePage() {
    return this.shopService.shop?.appConfig?.homePage;
  }
}
