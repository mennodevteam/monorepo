import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { File } from '@menno/types';
import { FileService } from '../../core/services/file.service';

@Directive({
  selector: '[fileImage]'
})
export class FileImageDirective implements OnChanges {
  @Input() file: string;
  @Input() avatarPlaceholder: boolean;
  @Input() placeholder: string;

  constructor(
    private el: ElementRef,
    private fileService: FileService,
  ) { }

  ngAfterViewInit(): void {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges){
    if (changes['file']) {
      this.init();
    }
  }

  init() {
    const nativeEl = this.el.nativeElement;
    let src = this.file ? this.fileService.getFileUrl(this.file) : undefined;
    const placeholderSrc = this.placeholder
      || (this.avatarPlaceholder ? 'assets/images/avatar.png' : 'assets/images/placeholder.png');

    if (!src) {
      src = placeholderSrc;
    }

    if (nativeEl.tagName.toLowerCase() === 'img') {
      nativeEl.src = src;
      nativeEl.onerror = `this.onerror = null;this.src=${placeholderSrc}`;
    } else {
      nativeEl.style.background = `url(${src}), url(${placeholderSrc})`;
      nativeEl.style.backgroundSize = 'cover';
      nativeEl.style.backgroundPosition = 'center';
    }
  }

}
