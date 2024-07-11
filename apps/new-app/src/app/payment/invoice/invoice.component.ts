import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { COMMON } from '../../common';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule, COMMON, MatListModule],
  templateUrl: './invoice.component.html',
  styleUrl: './invoice.component.scss',
})
export class InvoiceComponent {
  constructor(public cart: CartService) {}
}
