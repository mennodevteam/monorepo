import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DeliveryType } from '@menno/types';
import { ShopService } from '../../../shop/shop.service';
import { SHARED } from '../../../shared';

@Component({
  selector: 'app-delivery-type-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatCardModule,
    TranslateModule,
    SHARED,
  ],
  templateUrl: './delivery-type-dialog.component.html',
  styleUrl: './delivery-type-dialog.component.scss',
})
export class DeliveryTypeDialogComponent {
  readonly dialogRef = inject(MatDialogRef<DeliveryTypeDialogComponent>);
  readonly data = inject<{ currentType?: DeliveryType }>(MAT_DIALOG_DATA);
  readonly shopService = inject(ShopService);

  readonly DeliveryType = DeliveryType;
  readonly selectedType = signal<DeliveryType>(
    this.data?.currentType || DeliveryType.Standard
  );

  selectType(type: DeliveryType) {
    this.selectedType.set(type);
  }

  save() {
    this.shopService.saveAppConfigMutation.mutate({
      appConfig: { deliveryType: this.selectedType() },
      shop: null,
    });
    this.dialogRef.close(this.selectedType());
  }

  cancel() {
    this.dialogRef.close();
  }
}

