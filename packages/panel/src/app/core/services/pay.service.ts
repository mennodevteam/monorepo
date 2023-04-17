import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

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
      if (paymentLink) {
        var form = document.createElement('form');
        form.setAttribute('method', 'POST');
        form.setAttribute('action', paymentLink);
        form.setAttribute('target', '_self');
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
      }
    } catch (error) {
      console.log(error);
    }
  }
}
