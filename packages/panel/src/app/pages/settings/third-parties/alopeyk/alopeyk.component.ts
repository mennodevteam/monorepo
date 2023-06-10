import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ThirdParty, ThirdPartyApp } from '@menno/types';
import { ShopService } from '../../../../core/services/shop.service';

@Component({
  selector: 'hami',
  templateUrl: './alopeyk.component.html',
  styleUrls: ['./alopeyk.component.scss'],
})
export class AlopeykComponent {
  thirdPartyForm: FormGroup;

  constructor(private shopService: ShopService) {
    this.initForm();
  }

  get thirdParty() {
    return this.shopService.shop?.thirdParties?.find((x) => x.app === ThirdPartyApp.Alopeyk);
  }

  initForm() {
    this.thirdPartyForm = new FormGroup({
      token: new FormControl(this.thirdParty?.token, Validators.required),
    });
    this.thirdPartyForm.disable();
  }

  async save() {
    if (this.thirdPartyForm.invalid) return;
    const fv = this.thirdPartyForm.getRawValue();
    const dto = new ThirdParty();
    if (this.thirdParty) dto.id = this.thirdParty.id;
    dto.app = ThirdPartyApp.Alopeyk;
    dto.token = fv.token;
    await this.shopService.saveThirdParty(dto);
    this.initForm();
  }
}
