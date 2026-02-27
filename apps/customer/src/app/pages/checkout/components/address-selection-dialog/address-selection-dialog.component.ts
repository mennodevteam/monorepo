import { Component, effect, inject, signal, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  saxLocationCrossOutline,
  saxAddOutline,
} from '@ng-icons/iconsax/outline';
import { AddressesService } from '../../../../core/services/addresses.service';
import { CartService } from '../../../../core/services/cart.service';
import { MenuStatService } from '../../../../core/services/menu-stat.service';
import { AnalyticsService } from '../../../../core/services/analytics.service';
import { Address, StatAction } from '@menno/types';
import { AddressDialogComponent } from '../address-dialog/address-dialog.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-address-selection-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatListModule,
    MatButtonModule,
    MatDialogModule,
    NgIcon,
  ],
  providers: [
    provideIcons({
      saxLocationCrossOutline,
      saxAddOutline,
    }),
  ],
  template: `
    <h2 mat-dialog-title>انتخاب آدرس</h2>
    <mat-dialog-content class="mat-typography">
      @if (addresses.length > 0) {
        <mat-selection-list [multiple]="false" class="w-full">
          @for (address of addresses; track address.id) {
            <mat-list-option
              [value]="address"
              [selected]="selectedAddressId() === address.id"
              (click)="selectAddress(address)"
              class="mb-2 border border-gray-100 rounded-lg"
            >
              <div matListItemTitle class="font-bold">{{ address.title || 'آدرس' }}</div>
              <div matListItemLine class="text-gray-600 text-sm mt-1">
                @if (address.region) {
                  {{ address.region.state ? address.region.state + ' - ' : '' }}{{ address.region.title }}
                }
              </div>
              <div matListItemLine class="text-gray-500 text-xs mt-1">
                {{ address.description }}
              </div>
            </mat-list-option>
          }
        </mat-selection-list>
      } @else {
        <div class="empty-state">
          <ng-icon [svg]="locationIcon" size="64" class="empty-icon"></ng-icon>
          <p class="mat-body-medium mat-color-on-surface-variant">هنوز آدرسی ثبت نکرده‌اید.</p>
        </div>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="openAddAddressDialog()">
        <ng-icon [svg]="addIcon" size="20"></ng-icon>
        افزودن آدرس جدید
      </button>
      <button mat-button mat-dialog-close>بستن</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      mat-dialog-content {
        min-width: 300px;
        max-width: 500px;
      }
      mat-list-option {
        display: block;
      }
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px 16px;
        gap: 16px;
      }
      .empty-icon {
        color: var(--mat-sys-outline-variant);
        opacity: 0.6;
      }
    `,
  ],
})
export class AddressSelectionDialogComponent {
  addressesService = inject(AddressesService);
  cart = inject(CartService);
  analytics = inject(AnalyticsService);
  menuStat = inject(MenuStatService);
  dialog = inject(MatDialog);
  dialogRef = inject(MatDialogRef<AddressSelectionDialogComponent>);

  addresses: Address[] = [];
  selectedAddressId = signal<number | undefined>(undefined);
  locationIcon = saxLocationCrossOutline;
  addIcon = saxAddOutline;

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
    this.dialogRef.close(true);
  }

  openAddAddressDialog() {
    this.dialog.open(AddressDialogComponent, {
      width: '400px',
      disableClose: true,
    });
  }
}

