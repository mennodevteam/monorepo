import { Directive, HostListener, input } from '@angular/core';
import { AnalyticsService } from '../../core/services/analytics.service';

@Directive({
  standalone: true,
  selector: '[analyticsEvent]',
})
export class AnalyticsEventDirective {
  analyticsEvent = input.required<string>();
  analyticsData = input<any>();

  constructor(private analytics: AnalyticsService) {}

  @HostListener('click', ['$event']) onClick($event: any): void {
    console.log(this.analyticsEvent(), this.analyticsData());
    this.analytics.trackEvent(this.analyticsEvent(), this.analyticsData());
  }
}
