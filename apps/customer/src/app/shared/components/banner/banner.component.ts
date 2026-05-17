import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  PLATFORM_ID,
  input,
  computed,
  inject,
  signal,
  viewChild,
  ElementRef,
  effect,
  OnDestroy,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { HomeSection, BannerConfig, BannerAspectRatio, BannerLinkType } from '@menno/types';
import { ImageLoaderDirective } from '../../directives/image-loader.directive';
import { LinkService } from '../../../core/services/link.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [CommonModule, ImageLoaderDirective, RouterLink],
  templateUrl: './banner.component.html',
  styleUrl: './banner.component.scss',
})
export class BannerComponent implements OnDestroy {
  readonly section = input.required<HomeSection>();
  readonly isFirst = input<boolean>(false);
  private readonly linkService = inject(LinkService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly isBrowser = isPlatformBrowser(this.platformId);

  readonly config = computed(() => this.section().config as BannerConfig);
  readonly images = computed(() => this.config().images || []);
  readonly fullWidth = computed(() => this.config().fullWidth);
  readonly links = computed(() => this.config().links || []);
  readonly aspectRatio = computed(() => this.config().aspectRatio);

  readonly activeImageIndex = signal(0);
  private readonly carousel = viewChild<ElementRef<HTMLElement>>('carousel');
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    effect((onCleanup) => {
      if (!this.isBrowser) {
        return;
      }
      this.startAutoScroll();
      onCleanup(() => this.stopAutoScroll());
    });
  }

  ngOnDestroy(): void {
    this.stopAutoScroll();
  }

  getBannerHref(index: number): string | null {
    const link = this.links()[index];
    if (!link) {
      return null;
    }

    if (link.type === BannerLinkType.External && link.externalUrl) {
      return link.externalUrl;
    }
    if (link.type === BannerLinkType.Category && link.categoryId) {
      return this.linkService.getCategoryLink(link.categoryId);
    }
    if (link.type === BannerLinkType.Product && link.productId) {
      return this.linkService.getProductLink(link.productId);
    }
    return null;
  }

  isExternalHref(href: string): boolean {
    return href.startsWith('http://') || href.startsWith('https://');
  }

  private startAutoScroll() {
    this.stopAutoScroll();
    if (this.images().length <= 1) return;

    this.intervalId = setInterval(() => {
      const nextIndex = (this.activeImageIndex() + 1) % this.images().length;
      this.scrollToIndex(nextIndex);
    }, 3000);
  }

  private stopAutoScroll() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  scrollToIndex(index: number) {
    if (!this.isBrowser) {
      this.activeImageIndex.set(index);
      return;
    }

    this.activeImageIndex.set(index);
    const carouselEl = this.carousel()?.nativeElement;
    if (!carouselEl || typeof carouselEl.getBoundingClientRect !== 'function') {
      return;
    }

    const target = carouselEl.children[index] as HTMLElement | undefined;
    if (target && typeof target.getBoundingClientRect === 'function') {
        const containerRect = carouselEl.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const containerCenterX = containerRect.left + containerRect.width / 2;
        const targetCenterX = targetRect.left + targetRect.width / 2;

        const horizontalDelta = targetCenterX - containerCenterX;
        carouselEl.scrollTo({
          left: carouselEl.scrollLeft + horizontalDelta,
          behavior: 'smooth',
        });
    }
  }

  onCarouselScroll() {
    if (!this.isBrowser) {
      return;
    }

    this.stopAutoScroll();

    const carouselEl = this.carousel()?.nativeElement;
    if (carouselEl && typeof carouselEl.getBoundingClientRect === 'function') {
      const containerRect = carouselEl.getBoundingClientRect();
      const centerX = containerRect.left + containerRect.width / 2;
      let closestIndex = 0;
      let minDistance = Number.MAX_VALUE;

      Array.from(carouselEl.children).forEach((child, index) => {
        const childEl = child as HTMLElement;
        const childRect = childEl.getBoundingClientRect();
        const childCenterX = childRect.left + childRect.width / 2;
        const distance = Math.abs(childCenterX - centerX);

        if (distance < minDistance) {
          minDistance = distance;
          closestIndex = index;
        }
      });

      if (closestIndex !== this.activeImageIndex()) {
        this.activeImageIndex.set(closestIndex);
      }
    }

    this.startAutoScroll();
  }
}
