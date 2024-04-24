import { Directive, HostListener, Input } from '@angular/core';
import { MatomoService } from '../../core/services/matomo.service';

@Directive({
  selector: '[matomoClick]'
})
export class MatomoClickDirective {
  @Input() matomoClick: [string, string, string?, (string | number)?];

  constructor(
    private matomo: MatomoService
  ) { }

  @HostListener('click', ['$event']) onClick($event: any): void {
    this.matomo.trackEvent(this.matomoClick[0], this.matomoClick[1], this.matomoClick[2], this.matomoClick[3])
  }
}
