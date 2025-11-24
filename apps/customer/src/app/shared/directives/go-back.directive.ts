import { PlatformLocation } from '@angular/common';
import { Directive, HostListener, inject } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[appGoBack]',
})
export class GoBackDirective {
  private location = inject(PlatformLocation);

  @HostListener('click') onClick(): void {
    this.location.back();
  }
}
