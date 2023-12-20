import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PaymentGateway, PaymentGatewayType, ThirdPartyApp } from '@menno/types';
import { ShopService } from '../../../../core/services/shop.service';
import { environment } from '../../../../../environments/environment';
import { PayService } from '../../../../core/services/pay.service';

@Component({
  selector: 'zarinpal',
  templateUrl: './zarinpal.component.html',
  styleUrls: ['./zarinpal.component.scss'],
})
export class ZarinpalComponent {
  gatewayForm: FormGroup;
  gateway?: PaymentGateway;

  constructor(private shopService: ShopService, private http: HttpClient, private payService: PayService) {
    this.initForm();
  }

  async initForm() {
    const gateway = await this.http.get<PaymentGateway>(`paymentGateways`).toPromise();
    if (gateway?.type === PaymentGatewayType.Zarinpal) this.gateway = gateway;
    this.gatewayForm = new FormGroup({
      merchantId: new FormControl(this.gateway?.keys?.merchantId, Validators.required),
    });
    this.gatewayForm.disable();
  }

  async save() {
    if (this.gatewayForm.invalid) return;
    const fv = this.gatewayForm.getRawValue();
    const dto = new PaymentGateway();
    dto.type = PaymentGatewayType.Zarinpal;
    if (this.gateway) dto.id = this.gateway.id;
    dto.keys = fv;
    this.gateway = await this.http.post<PaymentGateway>(`paymentGateways`, dto).toPromise();
    this.initForm();
  }

  test() {
    this.payService.redirect('test', 1000);
  }
}
