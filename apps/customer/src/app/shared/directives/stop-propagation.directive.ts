import { Directive, HostListener } from '@angular/core';

@Directive({
  standalone: true,
  selector: '[appStopPropagation]',
})
export class StopPropagationDirective {
  @HostListener('click', ['$event']) onClick($event: Event): void {
    $event.stopPropagation();
  }
}
