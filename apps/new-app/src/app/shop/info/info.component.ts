import { Component } from '@angular/core';

import { MatToolbarModule } from '@angular/material/toolbar';
import { COMMON } from '../../common';
import { ShopService } from '../../core';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-info',
  standalone: true,
  imports: [MatToolbarModule, COMMON, MatCardModule, MatListModule, MatTooltipModule],
  templateUrl: './info.component.html',
  styleUrl: './info.component.scss',
})
export class InfoComponent {
  constructor(private shopService: ShopService) {}

  get shop() {
    return this.shopService.shop!;
  }

  get hasOpeningHours() {
    return this.shop.details.openingHours?.find((x) => x.length);
  }
}
