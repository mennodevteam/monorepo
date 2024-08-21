import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../core/services/cart.service';
import { COMMON } from '../../common';
import { MatListModule } from '@angular/material/list';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { DiscountCouponModalComponent } from '../../common/components';
import { DELIVERY_COST_TITLE } from '@menno/types';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [CommonModule, COMMON, MatListModule],
  templateUrl: './invoice.component.html',
  styleUrl: './invoice.component.scss',
})
export class InvoiceComponent {
  DELIVERY_COST_TITLE = DELIVERY_COST_TITLE;
  constructor(
    public cart: CartService,
    private sheet: MatBottomSheet,
  ) {}

  addCoupon() {
    this.sheet.open(DiscountCouponModalComponent, {
      disableClose: true,
    });
  }
}
