import { Component, input, computed, inject, signal, viewChild, ElementRef, effect, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { HomeSection, BannerConfig, BannerAspectRatio, BannerLinkType } from '@menno/types';
import { ImageLoaderDirective } from '../../directives/image-loader.directive';
import { LinkService } from '../../../core/services/link.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [CommonModule, ImageLoaderDirective],
  templateUrl: './banner.component.html',
  styleUrl: './banner.component.scss',
})
export class BannerComponent implements OnDestroy {
  readonly section = input.required<HomeSection>();
  private readonly router = inject(Router);
  private readonly linkService = inject(LinkService);

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
      this.startAutoScroll();
      onCleanup(() => this.stopAutoScroll());
    });
  }

  ngOnDestroy(): void {
    this.stopAutoScroll();
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
    this.activeImageIndex.set(index);
    const carouselEl = this.carousel()?.nativeElement;
    if (carouselEl) {
      const target = carouselEl.children[index] as HTMLElement;
      if (target) {
        const padding = this.fullWidth() ? 0 : 16;
        carouselEl.scrollTo({ left: target.offsetLeft - padding, behavior: 'smooth' });
      }
    }
  }

  onCarouselScroll() {
    this.stopAutoScroll();

    const carouselEl = this.carousel()?.nativeElement;
    if (carouselEl) {
      const centerX = carouselEl.scrollLeft + carouselEl.clientWidth / 2;
      let closestIndex = 0;
      let minDistance = Number.MAX_VALUE;

      Array.from(carouselEl.children).forEach((child, index) => {
        const childEl = child as HTMLElement;
        const childCenterX = childEl.offsetLeft + childEl.offsetWidth / 2;
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

  handleImageClick(index: number) {
    const link = this.links()[index];
    if (!link) return;

    if (link.type === BannerLinkType.External && link.externalUrl) {
      window.open(link.externalUrl, '_blank');
    } else if (link.type === BannerLinkType.Category && link.categoryId) {
      const categoryLink = this.linkService.getCategoryLink(link.categoryId);
      this.router.navigateByUrl(categoryLink);
    } else if (link.type === BannerLinkType.Product && link.productId) {
      const productLink = this.linkService.getProductLink(link.productId);
      this.router.navigateByUrl(productLink);
    }
  }
}

