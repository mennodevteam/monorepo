import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatCardModule } from '@angular/material/card';
import { MatBottomSheet, MatBottomSheetModule } from '@angular/material/bottom-sheet';
import { TranslateModule } from '@ngx-translate/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  saxTrashOutline,
  saxTicketOutline,
} from '@ng-icons/iconsax/outline';
import { CartService } from '../../../../core/services/cart.service';
import { DELIVERY_COST_TITLE } from '@menno/types';
import { DiscountCouponModalComponent } from '../../../../shared/components/discount-coupon-modal/discount-coupon-modal.component';

@Component({
  selector: 'app-invoice',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatButtonModule,
    MatDividerModule,
    MatCardModule,
    MatBottomSheetModule,
    TranslateModule,
    NgIcon,
  ],
  providers: [
    provideIcons({
      saxTrashOutline,
      saxTicketOutline,
    }),
  ],
  templateUrl: './invoice.component.html',
  styleUrl: './invoice.component.scss',
})
export class InvoiceComponent {
  cart = inject(CartService);
  sheet = inject(MatBottomSheet);
  DELIVERY_COST_TITLE = DELIVERY_COST_TITLE;
  removeIcon = saxTrashOutline;
  couponIcon = saxTicketOutline;

  addCoupon() {
    this.sheet.open(DiscountCouponModalComponent, {
      disableClose: true,
    });
  }
}
