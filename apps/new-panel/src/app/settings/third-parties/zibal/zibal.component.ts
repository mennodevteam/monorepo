import { HttpClient } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaymentGateway, PaymentGatewayType } from '@menno/types';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatListModule } from '@angular/material/list';
import { PayService } from '../../../core/services/pay.service';

@Component({
  selector: 'zibal',
  imports: [
    CommonModule,
    SHARED,
    MatToolbarModule,
    MatCardModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    MatListModule,
  ],
  templateUrl: './zibal.component.html',
  styleUrls: ['./zibal.component.scss'],
})
export class ZibalComponent {
  private http = inject(HttpClient);
  private payService = inject(PayService);
  gatewayForm: FormGroup;
  gateway?: PaymentGateway;

  constructor() {
    this.initForm();
  }

  async initForm() {
    const gateway = await this.http.get<PaymentGateway>(`paymentGateways`).toPromise();
    if (gateway?.type === PaymentGatewayType.Zibal) this.gateway = gateway;
    this.gatewayForm = new FormGroup({
      merchantId: new FormControl(this.gateway?.keys?.merchantId, Validators.required),
    });
    this.gatewayForm.disable();
  }

  async save() {
    if (this.gatewayForm.invalid) return;
    const fv = this.gatewayForm.getRawValue();
    const dto = new PaymentGateway();
    dto.type = PaymentGatewayType.Zibal;
    if (this.gateway) dto.id = this.gateway.id;
    dto.keys = fv;
    this.gateway = await this.http.post<PaymentGateway>(`paymentGateways`, dto).toPromise();
    this.initForm();
  }

  test() {
    this.payService.redirect('test', 1000);
  }
}
