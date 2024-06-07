import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ShopService } from '../../core';
import { Shop } from '@menno/types';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.scss',
})
export class WelcomeComponent {
  shop: Shop;
  constructor(private shopService: ShopService) {
    if (shopService.shop) {
      this.shop = shopService.shop;
    }
  }
}
