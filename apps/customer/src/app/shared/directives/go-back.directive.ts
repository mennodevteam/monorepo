import { Location } from '@angular/common';
import { Directive, HostListener, inject } from '@angular/core';
import { Router } from '@angular/router';

@Directive({
  standalone: true,
  selector: '[appGoBack]',
})
export class GoBackDirective {
  private location = inject(Location);
  private router = inject(Router);

  @HostListener('click') onClick(): void {
    const state = this.location.getState() as { navigationId?: number } | null;
    const canGoBack = (state?.navigationId ?? 0) > 1;

    if (canGoBack) {
      this.location.back();
    } else {
      void this.router.navigate(['/']);
    }
  }
}
