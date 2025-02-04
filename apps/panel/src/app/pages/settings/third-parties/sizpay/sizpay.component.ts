import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { PaymentGateway, PaymentGatewayType } from '@menno/types';
import { ShopService } from '../../../../core/services/shop.service';
import { environment } from '../../../../../environments/environment';
import { PayService } from '../../../../core/services/pay.service';

@Component({
  selector: 'sizpay',
  templateUrl: './sizpay.component.html',
  styleUrls: ['./sizpay.component.scss'],
})
export class SizpayComponent {
  gatewayForm: FormGroup;
  gateway?: PaymentGateway;

  constructor(private shopService: ShopService, private http: HttpClient, private payService: PayService) {
    this.initForm();
  }

  async initForm() {
    const gateway = await this.http.get<PaymentGateway>(`paymentGateways`).toPromise();
    if (gateway?.type === PaymentGatewayType.Sizpay) this.gateway = gateway;
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
    dto.type = PaymentGatewayType.Sizpay;
    if (this.gateway) dto.id = this.gateway.id;
    dto.keys = fv;
    this.gateway = await this.http.post<PaymentGateway>(`paymentGateways`, dto).toPromise();
    this.initForm();
  }

  get sizpayDocLink() {
    return environment.sizpayDocLink;
  }

  test() {
    this.payService.redirect('test', 1000);
  }
}
