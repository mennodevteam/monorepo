/* eslint-disable @angular-eslint/directive-selector */
import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Directive({
  standalone: true,
  selector: '[copyClipboard]',
})
export class CopyClipboardDirective {
  @Input() copyClipboard?: string | number;

  constructor(
    private el: ElementRef,
    private snack: MatSnackBar,
  ) {}

  @HostListener('click') onClick(): void {
    navigator.clipboard.writeText(this.copyClipboard || this.el.nativeElement.innerText);
    this.snack.open('کپی شد', '', { duration: 1500 });
  }
}
