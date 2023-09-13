import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PayService {
  constructor(private http: HttpClient) {}

  async redirect(type: string, amount?: number, body?: any) {
    let link = `payments/${type}`;
    if (amount) link += `/${amount}`;
    try {
      const paymentLink = body
        ? await this.http
            .post(link, body, {
              responseType: 'text',
            })
            .toPromise()
        : await this.http
            .get(link, {
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
    } catch (error) {}
  }
}
