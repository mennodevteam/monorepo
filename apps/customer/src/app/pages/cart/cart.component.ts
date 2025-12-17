import { Component, inject } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { MatListModule } from '@angular/material/list';
import { MatToolbarModule } from '@angular/material/toolbar';
import { QuantitySelectorComponent } from '../../shared/components/quantity-selector/quantity-selector.component';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { TopAppBarComponent } from '../../shared/components/top-app-bar/top-app-bar.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatToolbarModule,
    QuantitySelectorComponent,
    MatButtonModule,
    RouterModule,
    TopAppBarComponent,
    EmptyStateComponent,
    DecimalPipe,
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss',
})
export class CartComponent {
  cart = inject(CartService);
}
