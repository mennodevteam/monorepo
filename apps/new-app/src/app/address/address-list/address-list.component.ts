import { Component, computed } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { COMMON } from '../../common';
import { TopAppBarComponent } from '../../common/components';
import { MatListModule } from '@angular/material/list';
import { AddressesService, CartService, ShopService } from '../../core';
import { Address, DeliveryType } from '@menno/types';

@Component({
  selector: 'app-address-list',
  standalone: true,
  imports: [COMMON, TopAppBarComponent, MatListModule],
  templateUrl: './address-list.component.html',
  styleUrl: './address-list.component.scss',
})
export class AddressListComponent {
  deliveryType = computed(() => this.shopService.shop?.appConfig?.deliveryType);
  isStandard = computed(() => !this.deliveryType() || this.deliveryType() === DeliveryType.Standard);

  constructor(
    private addressesService: AddressesService,
    public cart: CartService,
    private shopService: ShopService,
    private location: PlatformLocation,
  ) {}

  get addresses() {
    return this.addressesService.addresses;
  }

  select(address: Address) {
    delete (address as any)['_checkedShopId'];
    this.cart.address.set({ ...address });
    this.cart.setAddressDeliveryArea();
    this.location.back();
  }
}
