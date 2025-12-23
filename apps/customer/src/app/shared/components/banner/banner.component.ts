import { Component, input, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { HomeSection, BannerConfig, BannerAspectRatio } from '@menno/types';
import { ImageLoaderDirective } from '../../directives/image-loader.directive';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [CommonModule, ImageLoaderDirective],
  templateUrl: './banner.component.html',
  styleUrl: './banner.component.scss',
})
export class BannerComponent {
  readonly section = input.required<HomeSection>();
  private readonly router = inject(Router);

  readonly config = computed(() => this.section().config as BannerConfig);
  readonly images = computed(() => this.config().images || []);
  readonly aspectRatio = computed(() => this.config().aspectRatio);
  readonly fullWidth = computed(() => this.config().fullWidth);
  readonly links = computed(() => this.config().links || []);

  readonly aspectRatioClass = computed(() => {
    const ratio = this.aspectRatio();
    return ratio === BannerAspectRatio.OneToOne ? 'aspect-1-1' : 'aspect-3-1';
  });

  handleImageClick(index: number) {
    const link = this.links()[index];
    if (link) {
      if (link.startsWith('http://') || link.startsWith('https://')) {
        window.open(link, '_blank');
      } else {
        this.router.navigateByUrl(link);
      }
    }
  }
}

