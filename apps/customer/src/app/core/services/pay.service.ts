import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AnalyticsService } from './analytics.service';

@Injectable({
  providedIn: 'root',
})
export class PayService {
  constructor(
    private http: HttpClient,
    private analytics: AnalyticsService,
  ) {}

  async redirect(link: string) {
    try {
      // Track payment gateway redirect
      this.analytics.trackEvent('redirect_to_payment_gateway');

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
