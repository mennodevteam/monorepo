import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ThirdParty, ThirdPartyApp } from '@menno/types';
import { ShopService } from 'packages/panel/src/app/core/services/shop.service';

@Component({
  selector: 'hami',
  templateUrl: './hami.component.html',
  styleUrls: ['./hami.component.scss'],
})
export class HamiComponent {
  thirdPartyForm: FormGroup;

  constructor(private shopService: ShopService, private http: HttpClient) {
    this.initForm();
  }

  get thirdParty() {
    return this.shopService.shop?.thirdParties?.find((x) => x.app === ThirdPartyApp.Hami);
  }

  initForm() {
    this.thirdPartyForm = new FormGroup({
      apiPath: new FormControl(this.thirdParty?.keys?.apiPath, Validators.required),
      token: new FormControl(this.thirdParty?.token, Validators.required),
    });
    this.thirdPartyForm.disable();
  }

  async save() {
    if (this.thirdPartyForm.invalid) return;
    const fv = this.thirdPartyForm.getRawValue();
    const dto = new ThirdParty();
    if (this.thirdParty) dto.id = this.thirdParty.id;
    dto.app = ThirdPartyApp.Hami;
    dto.token = fv.token;
    dto.keys = { apiPath: fv.apiPath };
    await this.shopService.saveThirdParty(dto);
    this.initForm();
  }

  syncMenu() {
    this.http.get('thirdParties/hami/syncMenu').toPromise();
  }
}
