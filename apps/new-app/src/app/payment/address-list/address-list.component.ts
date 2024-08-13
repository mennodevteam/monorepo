import { Component, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AddressesService, CartService, MenuService } from '../../core';
import { COMMON } from '../../common';
import { Address, OrderType } from '@menno/types';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-address-list',
  standalone: true,
  imports: [CommonModule, COMMON, FormsModule, MatListModule],
  templateUrl: './address-list.component.html',
  styleUrl: './address-list.component.scss',
})
export class AddressListComponent {
  OrderType = OrderType;
  address: Address[] = [];
  addresses: Address[] = [];
  constructor(
    public menu: MenuService,
    public addressesService: AddressesService,
    public cart: CartService,
  ) {
    effect(() => {
      this.setAddresses();
    });
  }

  setAddresses() {
    const addresses = this.addressesService.addresses();
    addresses?.sort((a, b) => {
      if (this.cart.address()?.id === a.id) return -1;
      if (this.cart.address()?.id === b.id) return 1;
      return 0;
    });
    this.addresses = addresses?.slice(0, 2) || [];
    untracked(() => {
      if (this.cart.address()) this.address = [this.cart.address()!];
    })
  }
}
