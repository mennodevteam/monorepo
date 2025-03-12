import { Directive, ElementRef, Renderer2, OnInit } from '@angular/core';

@Directive({
  selector: '[appLinkify]',
})
export class LinkifyDirective implements OnInit {
  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
  ) {}

  ngOnInit() {
    const text = this.el.nativeElement.innerHTML;
    if (!text) return;

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const modifiedText = text.replace(
      urlRegex,
      (url: string) => `<a href="${url}" target="_blank">${url}</a>`,
    );

    this.renderer.setProperty(this.el.nativeElement, 'innerHTML', modifiedText);
  }
}
