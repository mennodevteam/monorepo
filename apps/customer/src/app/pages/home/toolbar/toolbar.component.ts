import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { saxSearchNormal1Outline } from '@ng-icons/iconsax/outline';
import { ShopService } from '../../../core/services/shop.service';
import { ImageLoaderDirective } from "../../../shared/directives";

@Component({
  selector: 'app-home-toolbar',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, NgIcon, ImageLoaderDirective],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss',
  providers: [
    provideIcons({ saxSearchNormal1Outline }),
  ],
})
export class HomeToolbarComponent {
  private readonly shopService = inject(ShopService);
  readonly shopTitle = computed(() => this.shopService.data()?.title ?? '');
  readonly shopLogoUrl = computed(() => {
    const data = this.shopService.data();
    return data?.logoImage?.md ?? data?.logo ?? '';
  });
  searchIcon = saxSearchNormal1Outline;
}


