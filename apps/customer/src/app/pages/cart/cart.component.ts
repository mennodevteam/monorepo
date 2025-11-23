import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { MatListModule } from '@angular/material/list';
import { QuantitySelectorComponent } from '../../shared/components/quantity-selector/quantity-selector.component';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, MatListModule, QuantitySelectorComponent, MatButtonModule],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent {
  cart = inject(CartService);
}
