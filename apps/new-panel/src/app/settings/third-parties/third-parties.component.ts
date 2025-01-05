import { Component, inject } from '@angular/core';
import { ThirdParty } from '@menno/types';
import { ShopService } from '../../shop/shop.service';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'third-parties',
  imports: [CommonModule, SHARED, MatToolbarModule, MatCardModule, MatListModule],
  templateUrl: './third-parties.component.html',
  styleUrls: ['./third-parties.component.scss'],
})
export class ThirdPartiesComponent {
  private readonly shopService = inject(ShopService);
  thirdParties: { [key: string]: ThirdParty } = {};

  constructor() {
    for (const t of this.shopService.data()?.thirdParties || []) {
      this.thirdParties[t.app] = t;
    }
  }
}
