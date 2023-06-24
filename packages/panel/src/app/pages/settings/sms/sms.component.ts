import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { OrderMessage } from '@menno/types';

@Component({
  selector: 'sms',
  templateUrl: './sms.component.html',
  styleUrls: ['./sms.component.scss'],
})
export class SmsComponent {
  orderMessages?: OrderMessage[];

  constructor(private http: HttpClient) {
    this.loadOrderMessages();
  }

  async loadOrderMessages() {
    this.orderMessages = undefined;
    const res = await this.http.get<OrderMessage[]>('orderMessages').toPromise();
    if (res) {
      this.orderMessages = res;
    }
  }
}
