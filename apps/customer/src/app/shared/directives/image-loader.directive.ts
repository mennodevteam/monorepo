import {
  AfterViewInit,
  Directive,
  EffectRef,
  ElementRef,
  Injector,
  OnDestroy,
  effect,
  inject,
  input,
  runInInjectionContext,
} from '@angular/core';
import { Image } from '@menno/types';
import { getFileUrl } from '../../core/functions';

export enum ImagePlaceholder {
  Default = 'default',
  Person = 'person',
}

const DEFAULT_PLACEHOLDER_DATA_URL =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect fill="%23f2f2f2" width="120" height="120"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23cccccc" font-family="sans-serif" font-size="20">Image</text></svg>';
const PERSON_PLACEHOLDER_DATA_URL =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect fill="%23f2f2f2" width="120" height="120"/><circle cx="60" cy="48" r="24" fill="%23d9d9d9"/><path d="M20 108c0-22 18-40 40-40s40 18 40 40" fill="%23d9d9d9"/></svg>';

@Directive({
  selector: '[appImageLoader]',
  standalone: true,
})
export class ImageLoaderDirective implements AfterViewInit, OnDestroy {
  private static readonly observer = new IntersectionObserver(
    (entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) {
          continue;
        }

        const target = entry.target as HTMLElement;
        const src = target.getAttribute('data-image-src') ?? '';
        const placeholder = target.getAttribute('data-image-placeholder') ?? DEFAULT_PLACEHOLDER_DATA_URL;
        const fallback =
          target.getAttribute('data-image-default-placeholder') ?? DEFAULT_PLACEHOLDER_DATA_URL;

        if (target.tagName.toLowerCase() === 'img') {
          const img = target as HTMLImageElement;
          img.src = placeholder;
          img.onerror = () => {
            img.onerror = null;
            img.src = fallback;
          };

          if (src) {
            img.src = src;
          }
        } else {
          target.style.background = `url('${src}'), url('${placeholder}'), url('${fallback}')`;
          target.style.backgroundSize = 'cover';
          target.style.backgroundPosition = 'center';
        }

        observer.unobserve(target);
      }
    },
    { rootMargin: '200px', threshold: 0.1 },
  );

  private readonly element = inject(ElementRef<HTMLElement>);
  private readonly injector = inject(Injector);

  appImageLoader = input<string | undefined>(undefined);
  imageFile = input<Image | undefined>();
  imageSize = input<keyof Image | undefined>();
  placeholderImageSize = input<keyof Image>('xxs');
  placeholder = input<string | undefined>();
  defaultPlaceholder = input<ImagePlaceholder>(ImagePlaceholder.Default);

  private cleanupEffect?: EffectRef;

  ngAfterViewInit(): void {
    this.setupEffect();
  }

  ngOnDestroy(): void {
    this.cleanupEffect?.destroy();
    ImageLoaderDirective.observer.unobserve(this.element.nativeElement);
  }

  private setupEffect() {
    this.cleanupEffect?.destroy();
    this.cleanupEffect = runInInjectionContext(this.injector, () =>
      effect(() => {
        const element = this.element.nativeElement;
        const placeholder = this.resolvePlaceholder();
        const defaultPlaceholder = this.resolveDefaultPlaceholder();
        const source = this.resolveSource() ?? placeholder ?? defaultPlaceholder;

        element.setAttribute('data-image-src', source ?? '');
        element.setAttribute('data-image-placeholder', placeholder ?? '');
        element.setAttribute('data-image-default-placeholder', defaultPlaceholder);

        if (element.tagName.toLowerCase() === 'img') {
          const img = element as HTMLImageElement;
          img.src = placeholder ?? defaultPlaceholder;
        } else {
          element.style.background = `url('${placeholder ?? defaultPlaceholder}')`;
          element.style.backgroundSize = 'cover';
          element.style.backgroundPosition = 'center';
        }

        ImageLoaderDirective.observer.observe(element);
      }),
    );
  }

  private resolveSource(): string | undefined {
    const file = this.imageFile();
    if (file) {
      const selectedSize = this.imageSize();
      const key = selectedSize && file[selectedSize] ? file[selectedSize] : file.md;
      return getFileUrl(key);
    }

    const loader = this.appImageLoader();
    return getFileUrl(loader);
  }

  private resolvePlaceholder(): string | undefined {
    const placeholder = this.placeholder();
    if (placeholder) {
      return getFileUrl(placeholder);
    }

    const file = this.imageFile();
    if (file) {
      const size = this.placeholderImageSize();
      const key = size && file[size] ? file[size] : undefined;
      return getFileUrl(key);
    }

    return undefined;
  }

  private resolveDefaultPlaceholder(): string {
    switch (this.defaultPlaceholder()) {
      case ImagePlaceholder.Person:
        return PERSON_PLACEHOLDER_DATA_URL;
      case ImagePlaceholder.Default:
      default:
        return DEFAULT_PLACEHOLDER_DATA_URL;
    }
  }
}
