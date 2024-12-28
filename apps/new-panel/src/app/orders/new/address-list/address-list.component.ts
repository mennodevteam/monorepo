import { Component, effect, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { SHARED } from '../../../shared';
import { MatListModule } from '@angular/material/list';
import { MatRadioModule } from '@angular/material/radio';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { Address } from '@menno/types';
import { NewOrdersService } from '../new-order.service';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-address-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, SHARED, MatListModule, MatRadioModule, FormsModule],
  templateUrl: './address-list.component.html',
  styleUrl: './address-list.component.scss',
})
export class AddressListComponent {
  readonly service = inject(NewOrdersService);
  private readonly http = inject(HttpClient);

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
}
