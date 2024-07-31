import { Component } from '@angular/core';
import { CommonModule, PlatformLocation } from '@angular/common';
import { COMMON } from '../../common';
import { TopAppBarComponent } from '../../common/components';
import { MatListModule } from '@angular/material/list';
import { AddressesService, CartService } from '../../core';
import { Address } from '@menno/types';

@Component({
  selector: 'app-address-list',
  standalone: true,
  imports: [CommonModule, COMMON, TopAppBarComponent, MatListModule],
  templateUrl: './address-list.component.html',
  styleUrl: './address-list.component.scss',
})
export class AddressListComponent {
  constructor(
    private addressesService: AddressesService,
    public cart: CartService,
    private location: PlatformLocation,
  ) {}

  get addresses() {
    return this.addressesService.addresses;
  }

  select(address: Address) {
    this.cart.address.set(address);
    this.location.back();
  }
}
