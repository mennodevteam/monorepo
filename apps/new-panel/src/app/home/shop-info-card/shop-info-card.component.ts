import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { ShopService } from '../../shop/shop.service';

@Component({
  selector: 'app-shop-info-card',
  standalone: true,
  imports: [CommonModule, SHARED, MatCardModule, MatListModule],
  templateUrl: './shop-info-card.component.html',
  styleUrl: './shop-info-card.component.scss',
})
export class ShopInfoCardComponent {
  readonly shopService = inject(ShopService);
} 