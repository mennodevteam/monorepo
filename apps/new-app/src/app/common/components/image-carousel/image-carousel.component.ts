import { Component, effect, ElementRef, input, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Image } from '@menno/types';
import { COMMON } from '../..';

@Component({
  selector: 'app-image-carousel',
  standalone: true,
  imports: [CommonModule, COMMON],
  templateUrl: './image-carousel.component.html',
  styleUrl: './image-carousel.component.scss',
})
export class ImageCarouselComponent {
  images = input<Image[] | undefined>();
  container = viewChild<ElementRef<HTMLDivElement>>('container');
  imagesContainer = viewChild<ElementRef<HTMLDivElement>>('imagesContainer');
  index = signal(0);
  interval: any;

  constructor() {
    effect(() => {
      const index = this.index();
      const container = this.container();
      const imagesContainer = this.imagesContainer();
      if (container && imagesContainer) {
        const width = container.nativeElement.offsetWidth;
        const pos = -index * width;
        imagesContainer.nativeElement.scrollTo({
          left: pos,
          behavior: 'smooth',
        });
      }
    });

    this.startInterval();
  }

  startInterval() {
    if (this.interval) clearInterval(this.interval);
    this.interval = setInterval(() => {
      this.next(true);
    }, 6000);
  }

  next(skipRefresh?: boolean) {
    this.index.update((old) => {
      old++;
      return old % (this.images()?.length || 0);
    });
    if (!skipRefresh) this.startInterval();
  }
  prev() {
    this.index.update((old) => {
      old--;
      return Math.abs(old % (this.images()?.length || 0));
    });
    this.startInterval();
  }
}
