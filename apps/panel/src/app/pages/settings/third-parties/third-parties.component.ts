import { Component } from '@angular/core';
import { ThirdParty } from '@menno/types';
import { ShopService } from '../../../core/services/shop.service';

@Component({
  selector: 'third-parties',
  templateUrl: './third-parties.component.html',
  styleUrls: ['./third-parties.component.scss'],
})
export class ThirdPartiesComponent {
  thirdParties: { [key: string]: ThirdParty } = {};

  constructor(private shopService: ShopService) {
    if (this.shopService.shop?.thirdParties) {
      for (const t of this.shopService.shop?.thirdParties) {
        this.thirdParties[t.app] = t;
      }
    }
  }
}
