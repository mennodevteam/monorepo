import { PlatformLocation } from '@angular/common';
import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[goBack]'
})
export class GoBackDirective {

  constructor(
    private location: PlatformLocation
  ) { }

  @HostListener('click', ['$event']) onClick($event): void {
    this.location.back();
  }
}
