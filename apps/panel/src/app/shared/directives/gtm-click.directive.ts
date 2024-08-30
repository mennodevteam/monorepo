import { Directive, HostListener, Input } from '@angular/core';
import { AnalyticsService } from '../../core/services/analytics.service';

@Directive({
  selector: '[gtmClick]',
})
export class GtmClickDirective {
  @Input() gtmClick: string;
  @Input() gtmProps?: { [key: string]: string | number };

  constructor(private analytics: AnalyticsService) {}

  @HostListener('click', ['$event']) onClick($event: any): void {
    this.analytics.event(this.gtmClick, this.gtmProps);
  }
}
