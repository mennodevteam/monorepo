import { Directive, ElementRef, Input, SimpleChanges } from '@angular/core';
import { Image } from '@menno/types';
import { environment } from '../../../environments/environment';

export enum ImagePlaceholder {
  default = 'default',
  person = 'person',
}

@Directive({
  standalone: true,
  selector: '[imageLoader]',
})
export class ImageLoaderDirective {
  @Input() imageLoader?: string | undefined;
  @Input() imageFile?: Image;
  @Input() imageSize?: keyof Image = 'md';
  @Input() placeholderImageSize: keyof Image = 'xxs';
  @Input() placeholder: string;
  @Input() defaultPlaceholder = ImagePlaceholder.default;

  static observer = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const src = entry.target.getAttribute('imageSrc');
          const placeholder = entry.target.getAttribute('imagePlaceholder');
          const defaultPlaceholder = entry.target.getAttribute('defaultPlaceholder');
          if (entry.target.tagName.toLowerCase() === 'img') {
            const target = entry.target as HTMLImageElement;
            if (src) target.src = src;
            target.onerror = function () {
              this.onerror = function () {
                this.onerror = null;
                if (defaultPlaceholder) this.src = defaultPlaceholder;
              };
              if (placeholder) this.src = placeholder;
            };
          } else {
            const target = entry.target as HTMLDivElement;
            target.style.background = `url('${src}'), url(${placeholder}), url(${defaultPlaceholder})`;
            target.style.backgroundSize = 'cover';
            target.style.backgroundPosition = 'center';
          }
          observer.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '200px', threshold: 0.1 },
  );

  constructor(
    private el: ElementRef,
  ) {}

  ngAfterViewInit(): void {
    this.init();
  }

  // ngOnChanges(changes: SimpleChanges) {
  //   if (changes['imageLoader']) {
  //     this.init();
  //   }
  // }

  get defaultPlaceholderUrl() {
    if (this.defaultPlaceholder === ImagePlaceholder.default) {
      return `images/default.png`;
    }
    return `assets/images/placeholder/person.png`;
  }

  init() {
    let src: string | undefined = '';
    if (this.imageFile) {
      if (this.imageFile[this.placeholderImageSize] && !this.placeholder)
        this.placeholder = this.getUrl(this.imageFile[this.placeholderImageSize]);
      src = this.getUrl(
        this.imageSize && this.imageFile[this.imageSize] ? this.imageFile[this.imageSize] : this.imageFile.md,
      );
    } else if (this.imageLoader) src = this.getUrl(this.imageLoader);

    const nativeEl = this.el.nativeElement as HTMLElement;
    const placeholderSrc = this.placeholder || this.defaultPlaceholderUrl;

    if (!src) {
      src = placeholderSrc;
    }

    nativeEl.setAttribute('imageSrc', src);
    nativeEl.setAttribute('imagePlaceholder', placeholderSrc);
    nativeEl.setAttribute('defaultPlaceholder', this.defaultPlaceholderUrl);
    
    if (nativeEl.tagName.toLowerCase() === 'img') {
      (nativeEl as HTMLImageElement).src = placeholderSrc;
      (nativeEl as HTMLImageElement).onerror = function () {
        this.onerror = null;
        this.src = placeholderSrc;
      };
    } else {
      nativeEl.style.background = `url(${placeholderSrc})`;
      nativeEl.style.backgroundSize = 'cover';
      nativeEl.style.backgroundPosition = 'center';
    }
    ImageLoaderDirective.observer.observe(nativeEl);
  }

  private getUrl(url: string) {
    if (url.search('http') === 0) {
      return url;
    } else {
      return `${environment.bucketUrl}/${url}`;
    }
  }
}
