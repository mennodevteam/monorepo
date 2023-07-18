import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Address, DeliveryArea, User } from '@menno/types';
import {
  AdvancedPromptDialogComponent,
  PromptKeyFields,
} from '../advanced-prompt-dialog/advanced-prompt-dialog.component';
import { FormControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'user-addresses-dialog',
  templateUrl: './user-addresses-dialog.component.html',
  styleUrls: ['./user-addresses-dialog.component.scss'],
})
export class UserAddressesDialogComponent {
  user: User;
  addresses: Address[];
  deliveryAreas: DeliveryArea[];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<any>,
    private t: TranslateService,
    private http: HttpClient,
    private dialog: MatDialog
  ) {
    this.user = this.data.user;
    this.addresses = this.data.addresses;
    this.addresses.sort((a, b) => b.id - a.id);
    this.http.get<DeliveryArea[]>('deliveryAreas').subscribe((data) => {
      this.deliveryAreas = data || [];
    });
  }

  edit(add?: Address) {
    const deliveryAreaOptions = this.deliveryAreas.map((d) => ({ text: d.title, value: d }));
    const fields: PromptKeyFields = {
      description: {
        label: this.t.instant(`editAddressDialog.address`),
        control: new FormControl(add?.description, Validators.required),
      },
      deliveryArea: {
        label: this.t.instant(`editAddressDialog.deliveryArea`),
        control: new FormControl(
          add?.deliveryArea ?? deliveryAreaOptions.find((x) => x.value?.id === add?.deliveryArea?.id)?.value,
          Validators.required
        ),
        type: 'select',
        options: deliveryAreaOptions,
      },
    };

    this.dialog
      .open(AdvancedPromptDialogComponent, {
        disableClose: true,
        data: {
          title: this.t.instant(`editAddressDialog.title`),
          fields,
        },
      })
      .afterClosed()
      .subscribe((dto: Address) => {
        if (dto) {
          if (add) dto.id = add.id;
          dto.user = { id: this.user.id } as User;
          debugger
          this.http.post<Address>('addresses', dto).subscribe((data) => {
            if (data) {
              if (add) {
                add.deliveryArea = this.deliveryAreas.find((x) => x.id === dto.deliveryArea?.id);
                add.description = dto.description;
              } else {
                dto.deliveryArea = this.deliveryAreas.find((x) => x.id === dto.deliveryArea?.id);
                this.addresses.unshift(data);
              }
            }
          });
        }
      });
  }
}
