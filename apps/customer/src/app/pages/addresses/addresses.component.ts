import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatDialog } from '@angular/material/dialog';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { saxEditOutline } from '@ng-icons/iconsax/outline';
import { AddressesService } from '../../core/services/addresses.service';
import { AddressSelectionDialogComponent } from '../checkout/components/address-selection-dialog/address-selection-dialog.component';
import { AddressDialogComponent } from '../checkout/components/address-dialog/address-dialog.component';
import { Address } from '@menno/types';
import { TopAppBarComponent } from '../../shared/components/top-app-bar/top-app-bar.component';

@Component({
  selector: 'app-addresses',
  standalone: true,
  imports: [CommonModule, MatListModule, MatButtonModule, MatToolbarModule, NgIcon, TopAppBarComponent],
  providers: [
    provideIcons({
      saxEditOutline,
    }),
  ],
  templateUrl: './addresses.component.html',
  styleUrl: './addresses.component.scss',
})
export class AddressesComponent {
  addressesService = inject(AddressesService);
  dialog = inject(MatDialog);
  editIcon = saxEditOutline;

  get addresses() {
    return this.addressesService.addresses() || [];
  }

  openAddAddressDialog() {
    const dialogRef = this.dialog.open(AddressDialogComponent, {
      width: '90%',
      maxWidth: '500px',
      disableClose: true,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.addressesService.load();
      }
    });
  }

  openEditAddressDialog(address: Address) {
    const dialogRef = this.dialog.open(AddressDialogComponent, {
      width: '90%',
      maxWidth: '500px',
      disableClose: true,
      data: address,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.addressesService.load();
      }
    });
  }
}

