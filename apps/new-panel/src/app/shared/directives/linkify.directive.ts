import { Directive, ElementRef, Renderer2, OnInit, Input } from '@angular/core';

@Directive({
  selector: '[appLinkify]',
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
      (url: string) => `<a href="${url}" target="_blank">${url}</a>`,
    );

    this.renderer.setProperty(this.el.nativeElement, 'innerHTML', modifiedText);
  }
}
