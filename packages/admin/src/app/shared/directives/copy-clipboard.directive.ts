import { Directive, ElementRef, HostListener, Input } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';

@Directive({
  selector: '[copyClipboard]',
})
export class CopyClipboardDirective {
  @Input() copyClipboard?: string | number;

  constructor(private el: ElementRef, private snack: MatSnackBar, private translate: TranslateService) {}

  @HostListener('click') onClick(): void {
    navigator.clipboard.writeText(this.copyClipboard || this.el.nativeElement.innerText);
    this.snack.open(this.translate.instant('app.copied'), '', { duration: 1500 });
  }
}
