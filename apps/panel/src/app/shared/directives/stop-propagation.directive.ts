import { Directive, HostListener } from '@angular/core';

@Directive({
  standalone: false,
  selector: '[stopPropagation]'
})
export class StopPropagationDirective {

  constructor() { }

  @HostListener('click', ['$event']) onClick($event: any): void {
    $event.stopPropagation();
  }
}
