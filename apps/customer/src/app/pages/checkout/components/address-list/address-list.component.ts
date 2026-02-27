import { Component, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { AddressesService } from '../../../../core/services/addresses.service';
import { CartService } from '../../../../core/services/cart.service';
import { MenuStatService } from '../../../../core/services/menu-stat.service';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { Address, StatAction } from '@menno/types';
import { AddressDialogComponent } from '../address-dialog/address-dialog.component';

@Component({
  selector: 'app-address-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatListModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    TranslateModule,
  ],
  templateUrl: './address-list.component.html',
  styleUrl: './address-list.component.scss',
})
export class AddressListComponent {
  addressesService = inject(AddressesService);
  cart = inject(CartService);
  analytics = inject(AnalyticsService);
  menuStat = inject(MenuStatService);
  dialog = inject(MatDialog);

  addresses: Address[] = [];
  selectedAddressId = signal<number | undefined>(undefined);

  constructor() {
    effect(() => {
      this.setAddresses();
    });
  }

  setAddresses() {
    const addresses = this.addressesService.addresses();
    if (addresses) {
      this.addresses = addresses.sort((a, b) => {
        if (this.cart.address()?.id === a.id) return -1;
        if (this.cart.address()?.id === b.id) return 1;
        return 0;
      });

      untracked(() => {
        if (this.cart.address()) {
          this.selectedAddressId.set(this.cart.address()?.id);
        } else if (this.addresses.length > 0) {
          // Auto-select first address if none selected
          this.selectAddress(this.addresses[0]);
        }
      });
    }
  }

  selectAddress(address: Address) {
    this.cart.address.set(address);
    this.selectedAddressId.set(address.id);

    // Track address selection
    this.analytics.trackEvent('address_selected', {
      addressId: address.id,
      region: address.region,
    });

    this.menuStat.send(StatAction.SelectAddress);
  }

  openAddressDialog() {
    this.dialog.open(AddressDialogComponent, {
      width: '400px',
      disableClose: true,
    });
  }
}
