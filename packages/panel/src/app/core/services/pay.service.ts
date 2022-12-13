import { Payment } from '@menno/types';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { FilterPayment } from '@menno/types';

@Injectable({
  providedIn: 'root',
})
export class PayService {
  constructor(private http: HttpClient) {}

  async redirect(type: string, amount: number) {
    try {
      const paymentLink = await this.http
        .get(`payments/${type}/${amount}`, {
          responseType: 'text',
        })
        .toPromise();
      var form = document.createElement('form');
      form.setAttribute('method', 'POST');
      form.setAttribute('action', paymentLink);
      form.setAttribute('target', '_self');
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } catch (error) {
      console.log(error);
    }
  }

  filter(dto: FilterPayment): Promise<Payment[]> {
    return this.http.post<Payment[]>('payments/filter', dto).toPromise();
  }

  async savePayments(payment: Payment): Promise<any> {
    await this.http.post<Payment>('payments', payment).toPromise();
  }
}
