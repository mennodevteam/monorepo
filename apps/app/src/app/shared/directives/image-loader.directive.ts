import { Directive, ElementRef, Input, SimpleChanges } from '@angular/core';
import { FilesService } from '../../core/services/files.service';
import { ThemeService } from '../../core/services/theme.service';

export enum ImagePlaceholder {
  default = 'default',
  person = 'person',
}

@Directive({
  selector: '[imageLoader]',
})
export class ImageLoaderDirective {
  @Input() imageLoader?: string | undefined;
  @Input() placeholder: string;
  @Input() defaultPlaceholder = ImagePlaceholder.default;

  constructor(
    private el: ElementRef,
    private fileService: FilesService,
    private themeService: ThemeService
  ) {}

  ngAfterViewInit(): void {
    this.init();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['imageLoader']) {
      this.init();
    }
  }

  get defaultPlaceholderUrl() {
    if (this.defaultPlaceholder === ImagePlaceholder.default) {
      return `assets/images/placeholder/default.png`;
    }
    return `assets/images/placeholder/person.png`;
  }

  init() {
    const nativeEl = this.el.nativeElement;
    let src = this.imageLoader ? this.fileService.getFileUrl(this.imageLoader) : undefined;
    const placeholderSrc = this.placeholder || this.defaultPlaceholderUrl;

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
      nativeEl.style.background = `url('${src}'), url(${placeholderSrc})`;
      nativeEl.style.backgroundSize = 'cover';
      nativeEl.style.backgroundPosition = 'center';
    }
  }
}
