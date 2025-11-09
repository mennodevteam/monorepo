import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { saxSearchNormal1Outline, saxInfoCircleOutline } from '@ng-icons/iconsax/outline';
import { ShopService } from '../../../core/services/shop.service';
import { ImageLoaderDirective } from '../../directives';

@Component({
  selector: 'app-root-app-bar',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, NgIcon, ImageLoaderDirective],
  templateUrl: './root-app-bar.component.html',
  styleUrl: './root-app-bar.component.scss',
  providers: [
    provideIcons({ saxSearchNormal1Outline, saxInfoCircleOutline }),
  ],
})
export class RootAppBarComponent {
  private readonly shopService = inject(ShopService);
  readonly shopTitle = computed(() => this.shopService.data()?.title ?? '');
  readonly shopLogoUrl = computed(() => {
    const data = this.shopService.data();
    return data?.logoImage?.md ?? data?.logo ?? '';
  });
  readonly searchIcon = saxSearchNormal1Outline;
  readonly infoIcon = saxInfoCircleOutline;
}


