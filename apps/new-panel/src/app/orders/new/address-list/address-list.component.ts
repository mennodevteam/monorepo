import { Component, effect, inject } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { SHARED } from '../../../shared';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { injectQuery, injectQueryClient } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { Address, User } from '@menno/types';
import { NewOrdersService } from '../new-order.service';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { AddressFormDialogComponent } from '../../../shared/dialogs/address-form-dialog/address-form-dialog.component';
import { ClubService } from '../../../core/services/club.service';

@Component({
  selector: 'app-address-list',
  standalone: true,
  imports: [MatCardModule, SHARED, MatListModule, MatRadioModule, FormsModule],
  templateUrl: './address-list.component.html',
  styleUrl: './address-list.component.scss',
})
export class AddressListComponent {
  readonly service = inject(NewOrdersService);
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly club = inject(ClubService);
  private readonly queryClient = injectQueryClient();

  addressesQuery = injectQuery(() => ({
    queryKey: ['addresses', this.service.customer()?.id],
    queryFn: () => lastValueFrom(this.http.get<Address[]>(`/addresses/${this.service.customer()?.id}`)),
    enabled: !!this.service.customer(),
  }));

  constructor() {
    effect(() => {
      const addresses = this.addressesQuery.data();
      if (!this.service.address() && addresses?.length) {
        this.service.address.set(addresses[0]);
      }
    });
  }

  selectAddress(address: Address) {
    this.service.address.set(address);
    this.service.dirty.set(true);
  }

  addAddress() {
    this.dialog
      .open(AddressFormDialogComponent, {
        disableClose: true,
      })
      .afterClosed()
      .subscribe(async (dto: Address) => {
        if (dto) {
          const user = this.service.customer();
          if (user) dto.user = { id: user.id } as User;
          const newAddress = await this.club.saveAddressMutation.mutateAsync(dto);
          if (newAddress) {
            this.selectAddress(newAddress);
            this.queryClient.setQueryData(
              ['addresses', this.service.customer()?.id],
              (oldData: Address[]) => {
                return [newAddress, ...oldData];
              },
            );
          }
        }
      });
  }
}
