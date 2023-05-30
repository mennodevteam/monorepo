import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PaymentGateway, ThirdPartyApp } from '@menno/types';
import { ShopService } from '../../../../core/services/shop.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'sizpay',
  templateUrl: './sizpay.component.html',
  styleUrls: ['./sizpay.component.scss'],
})
export class SizpayComponent {
  gatewayForm: FormGroup;
  gateway?: PaymentGateway;

  constructor(private shopService: ShopService, private http: HttpClient) {
    this.initForm();
  }

  async initForm() {
    this.gateway = await this.http.get<PaymentGateway>(`paymentGateways`).toPromise();
    this.gatewayForm = new FormGroup({
      merchantId: new FormControl(this.gateway?.keys?.merchantId, Validators.required),
      terminalId: new FormControl(this.gateway?.keys?.terminalId, Validators.required),
      username: new FormControl(this.gateway?.keys?.username, Validators.required),
      password: new FormControl(this.gateway?.keys?.password, Validators.required),
    });
    this.gatewayForm.disable();
  }

  async save() {
    if (this.gatewayForm.invalid) return;
    const fv = this.gatewayForm.getRawValue();
    const dto = new PaymentGateway();
    if (this.gateway) dto.id = this.gateway.id;
    dto.keys = fv;
    this.gateway = await this.http.post<PaymentGateway>(`paymentGateways`, dto).toPromise();
    this.initForm();
  }

  get sizpayDocLink() {
    return environment.sizpayDocLink;
  }
}
