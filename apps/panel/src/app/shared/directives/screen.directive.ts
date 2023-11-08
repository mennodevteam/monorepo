import { Directive, Input, TemplateRef, ViewContainerRef } from '@angular/core';
import { AuthService } from '../../core/services/auth.service';
import { BreakpointObserver } from '@angular/cdk/layout';

@Directive({
  selector: '[screen]',
})
export class ScreenDirective {
  constructor(
    private breakpoints: BreakpointObserver,
    private auth: AuthService,
    private templateRef: TemplateRef<any>,
    private viewContainer: ViewContainerRef
  ) {}

  @Input() set screen(size: 'DESKTOP' | 'MOBILE') {
    const isMobile = this.breakpoints.isMatched('(max-width: 800px)');
    if ((size === 'MOBILE' && isMobile) || (size === 'DESKTOP' && !isMobile)) {
      // If the condition is true, create and render the embedded view
      this.viewContainer.createEmbeddedView(this.templateRef);
    } else {
      // If the condition is false, clear the view container
      this.viewContainer.clear();
    }
  }
}
