import { Component } from '@angular/core';
import { ShopService } from '../../core/services/shop.service';
import { HomePage } from '@menno/types';

@Component({
  selector: 'ordering',
  templateUrl: './ordering.component.html',
  styleUrls: ['./ordering.component.scss'],
})
export class OrderingComponent {
  HomePage = HomePage;
  constructor(private shopService: ShopService) {

  }

  get homePage() {
    return this.shopService.shop?.appConfig?.homePage;
  }
}
