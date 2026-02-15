import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appLinkify]',
  standalone: true,
})
export class LinkifyDirective implements OnInit {
  @Input() appLinkify = '';

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  ngOnInit() {
    if (!this.appLinkify) return;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const modifiedText = this.appLinkify.replace(
      urlRegex,
      (url: string) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`,
    );

    this.renderer.setProperty(this.el.nativeElement, 'innerHTML', modifiedText);
  }
}
