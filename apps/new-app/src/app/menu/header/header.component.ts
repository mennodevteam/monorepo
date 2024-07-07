import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderType, Shop } from '@menno/types';
import { COMMON } from '../../common';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, COMMON, MatToolbarModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  @Input() shop: Shop;
  OrderType = OrderType;
}
