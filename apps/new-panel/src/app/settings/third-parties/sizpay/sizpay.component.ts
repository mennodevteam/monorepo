import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { PaymentGateway, PaymentGatewayType } from '@menno/types';
import { SHARED } from '../../../shared';
import { PayService } from '../../../core/services/pay.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'sizpay',
  imports: [
    CommonModule,
    SHARED,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatListModule,
  ],
  templateUrl: './sizpay.component.html',
  styleUrls: ['./sizpay.component.scss'],
})
export class SizpayComponent {
  private http = inject(HttpClient);
  private payService = inject(PayService);
  gatewayForm: FormGroup;
  gateway?: PaymentGateway;

  constructor() {
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

  test() {
    this.payService.redirect('test', 1000);
  }
}
