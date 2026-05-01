import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { BaleBotKeys, ThirdParty, ThirdPartyApp } from '@menno/types';

import { SHARED } from '../../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { ShopService } from '../../../shop/shop.service';

@Component({
  selector: 'app-bale',
  imports: [
    SHARED,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatListModule,
  ],
  templateUrl: './bale.component.html',
  styleUrl: './bale.component.scss',
})
export class BaleComponent {
  private readonly http = inject(HttpClient);
  private readonly shopService = inject(ShopService);
  thirdPartyForm: FormGroup;

  constructor() {
    this.initForm();
  }

  get thirdParty() {
    return this.shopService.data()?.thirdParties?.find((x) => x.app === ThirdPartyApp.Bale);
  }

  initForm() {
    const keys = (this.thirdParty?.keys as BaleBotKeys) || {};
    this.thirdPartyForm = new FormGroup({
      token: new FormControl(this.thirdParty?.token, Validators.required),
      startMessage: new FormControl(keys.start?.message),
      primaryButtonText: new FormControl(keys.start?.primaryButtonText),
      secondaryButtonText: new FormControl(keys.start?.secondaryButtonText),
    });
    this.thirdPartyForm.disable();
  }

  async save() {
    if (this.thirdPartyForm.invalid) return;
    const fv = this.thirdPartyForm.getRawValue();

    const dto = new ThirdParty();
    if (this.thirdParty) dto.id = this.thirdParty.id;
    dto.app = ThirdPartyApp.Bale;
    dto.token = fv.token;
    dto.keys = {
      start: {
        message: fv.startMessage,
        primaryButtonText: fv.primaryButtonText,
        secondaryButtonText: fv.secondaryButtonText,
      },
    };

    await this.http.post(`thirdParties`, dto).toPromise();
    this.initForm();
  }
}
