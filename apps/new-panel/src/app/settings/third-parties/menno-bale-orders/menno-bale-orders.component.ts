import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MennoBaleOrderKeys, ThirdParty, ThirdPartyApp } from '@menno/types';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { lastValueFrom } from 'rxjs';

import { SHARED } from '../../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { ShopService } from '../../../shop/shop.service';

@Component({
  selector: 'app-menno-bale-orders',
  imports: [
    SHARED,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatListModule,
  ],
  templateUrl: './menno-bale-orders.component.html',
  styleUrl: './menno-bale-orders.component.scss',
})
export class MennoBaleOrdersComponent {
  private readonly http = inject(HttpClient);
  private readonly shopService = inject(ShopService);
  private readonly snack = inject(MatSnackBar);
  private readonly t = inject(TranslateService);

  thirdPartyForm: FormGroup;

  constructor() {
    this.initForm();
  }

  get thirdParty() {
    return this.shopService.data()?.thirdParties?.find((x) => x.app === ThirdPartyApp.MennoBaleOrders);
  }

  initForm() {
    const keys = (this.thirdParty?.keys as MennoBaleOrderKeys) || {};
    this.thirdPartyForm = new FormGroup({
      channelId: new FormControl(keys.channelId, Validators.required),
    });
    this.thirdPartyForm.disable();
  }

  async save() {
    if (this.thirdPartyForm.invalid) return;
    const fv = this.thirdPartyForm.getRawValue();

    const dto = new ThirdParty();
    if (this.thirdParty) dto.id = this.thirdParty.id;
    dto.app = ThirdPartyApp.MennoBaleOrders;
    dto.token = null;
    dto.keys = {
      channelId: fv.channelId?.trim(),
    };

    await lastValueFrom(this.http.post<ThirdParty>(`/thirdParties`, dto));
    await this.shopService.refetchShop();
    this.snack.open(this.t.instant('app.savedSuccessfully'), '', { duration: 2500 });
    this.initForm();
  }
}
