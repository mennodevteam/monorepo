import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PayService {
  constructor(private http: HttpClient) {}

  async redirect(link: string) {
    try {
      const form = document.createElement('form');
      form.setAttribute('method', 'POST');
      form.setAttribute('action', link);
      form.setAttribute('target', '_self');
      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } catch (error) {}
  }
}
