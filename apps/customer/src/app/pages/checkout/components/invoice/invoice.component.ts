import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { TranslateModule } from '@ngx-translate/core';
import { CartService } from '../../../../core/services/cart.service';
import { DELIVERY_COST_TITLE } from '@menno/types';
// Assuming DiscountCouponModalComponent exists or needs to be created/mocked.
// For now, I'll assume it might be in shared or I need to create a simple one.
// Based on file list, it wasn't explicitly seen in customer shared.
// I will create a simple placeholder or check if I can reuse something.
// For now, I'll omit the complex coupon modal and just put a placeholder button.

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatBottomSheetModule,
    TranslateModule,
  ],
  templateUrl: './invoice.component.html',
  styleUrl: './invoice.component.scss',
})
export class InvoiceComponent {
  cart = inject(CartService);
  sheet = inject(MatBottomSheet);
  DELIVERY_COST_TITLE = DELIVERY_COST_TITLE;

  addCoupon() {
    // TODO: Implement coupon modal
    // this.sheet.open(DiscountCouponModalComponent, {
    //   disableClose: true,
    // });
    alert('Coupon functionality to be implemented');
  }
}
