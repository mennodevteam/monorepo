import { Component, inject, signal } from '@angular/core';
import { CommonModule, PlatformLocation } from '@angular/common';
import { NewOrdersService } from './new-order.service';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { NewOrderItemsComponent } from './items/items.component';
import { FormControl, Validators } from '@angular/forms';
import { OrderType } from '@menno/types';
import { ShopService } from '../../shop/shop.service';
import { FormComponent } from '../../core/guards/dirty-form-deactivator.guard';
import { DialogService } from '../../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { AddressListComponent } from './address-list/address-list.component';
import { CustomerComponent } from './customer/customer.component';
import { OrderTypeComponent } from './order-type/order-type.component';

@Component({
  selector: 'app-new',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatToolbarModule,
    MatCardModule,
    NewOrderItemsComponent,
    AddressListComponent,
    CustomerComponent,
    OrderTypeComponent,
  ],
  providers: [NewOrdersService],
  templateUrl: './new.component.html',
  styleUrl: './new.component.scss',
})
export class NewOrderComponent implements FormComponent {
  readonly t = inject(TranslateService);
  readonly shop = inject(ShopService);
  readonly dialog = inject(DialogService);
  readonly service = inject(NewOrdersService);
  readonly location = inject(PlatformLocation);
  saving = signal(false);
  OrderType = OrderType;

  canDeactivate() {
    return !this.service.dirty();
  }

  setManualDiscount() {
    const title = this.t.instant('newOrder.manualDiscount');
    this.dialog
      .prompt(title, {
        value: {
          label: title,
          control: new FormControl(this.service.manualDiscount() || undefined, Validators.required),
          hint: this.t.instant('app.currency'),
          type: 'number',
        },
      })
      .then((dto) => {
        if (dto) {
          this.service.manualDiscount.set(dto.value || 0);
        }
      });
  }

  setManualCost() {
    const title = this.t.instant('newOrder.manualCost');
    this.dialog
      .prompt(title, {
        value: {
          label: title,
          control: new FormControl(this.service.manualCost() || undefined, Validators.required),
          hint: this.t.instant('app.currency'),
          type: 'number',
        },
      })
      .then((dto) => {
        if (dto) {
          this.service.manualCost.set(dto.value || 0);
        }
      });
  }

  async save() {
    try {
      this.saving.set(true);
      await this.service.save();
      this.location.back();
    } finally {
      this.saving.set(false);
    }
  }
}
