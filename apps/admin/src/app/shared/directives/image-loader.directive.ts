import { Directive, ElementRef, Input, SimpleChanges } from '@angular/core';
import { FilesService } from '../../core/services/files.service';

export enum ImagePlaceholder {
  default = 'default',
  person = 'person',
}

@Directive({
  selector: '[imageLoader]',
})
export class ImageLoaderDirective {
  @Input() imageLoader?: string;
  @Input() placeholder: string;
  @Input() defaultPlaceholder = ImagePlaceholder.default;

  constructor(private el: ElementRef, private fileService: FilesService) {}

  ngAfterViewInit(): void {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['imageLoader']) {
      this.init();
    }
  }

  init() {
    const nativeEl = this.el.nativeElement;
    let src = this.imageLoader ? this.fileService.getFileUrl(this.imageLoader) : undefined;
    const placeholderSrc = this.placeholder || `assets/images/placeholder/${this.defaultPlaceholder}.png`;

    if (!src) {
      src = placeholderSrc;
    }

    if (nativeEl.tagName.toLowerCase() === 'img') {
      nativeEl.src = src;
      nativeEl.onerror = function () {
        this.onerror = null;
        this.src = placeholderSrc;
      };
    } else {
      nativeEl.style.background = `url(${src}), url(${placeholderSrc})`;
      nativeEl.style.backgroundSize = 'cover';
      nativeEl.style.backgroundPosition = 'center';
    }
  }
}
