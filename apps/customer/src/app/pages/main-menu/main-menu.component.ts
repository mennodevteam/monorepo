import { Component, inject, computed } from '@angular/core';
import { TopAppBarComponent } from '../../shared/components/top-app-bar/top-app-bar.component';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  saxProfile2userOutline,
  saxBoxOutline,
  saxEditOutline,
  saxInfoCircleOutline,
  saxCrownOutline,
  saxShieldOutline,
  saxShareOutline,
  saxArrowLeft2Outline,
  saxLocationOutline,
  saxDirectDownOutline,
} from '@ng-icons/iconsax/outline';
import { AuthService } from '../../core/services/auth.service';
import { MenuService } from '../../core/services/menu.service';
import { ShopService } from '../../core/services/shop.service';
import { User } from '@menno/types';
import { ImageLoaderDirective } from '../../shared/directives/image-loader.directive';

@Component({
  selector: 'app-main-menu',
  standalone: true,
  imports: [
    TopAppBarComponent,
    MatListModule,
    MatButtonModule,
    RouterModule,
    CommonModule,
    ImageLoaderDirective,
    NgIcon,
  ],
  templateUrl: './main-menu.component.html',
  styleUrl: './main-menu.component.scss',
  providers: [
    provideIcons({
      saxProfile2userOutline,
      saxBoxOutline,
      saxEditOutline,
      saxInfoCircleOutline,
      saxCrownOutline,
      saxShieldOutline,
      saxShareOutline,
      saxArrowLeft2Outline,
      saxLocationOutline,
      saxDirectDownOutline,
    }),
  ],
})
export class MainMenuComponent {
  auth = inject(AuthService);
  menuService = inject(MenuService);
  shopService = inject(ShopService);

  readonly user = computed(() => this.auth.user());
  readonly fullName = computed(() => {
    const user = this.user();
    if (!user) return '';
    return User.fullName(user);
  });

  readonly profileIcon = saxProfile2userOutline;
  readonly ordersIcon = saxBoxOutline;
  readonly editIcon = saxEditOutline;
  readonly infoIcon = saxInfoCircleOutline;
  readonly clubIcon = saxCrownOutline;
  readonly privacyIcon = saxShieldOutline;
  readonly shareIcon = saxShareOutline;
  readonly chevronIcon = saxArrowLeft2Outline;
  readonly locationIcon = saxLocationOutline;
  readonly downloadIcon = saxDirectDownOutline;

  share() {
    const shop = this.shopService.data();
    if (shop && 'share' in navigator) {
      try {
        const shareData = {
          title: shop.title,
          text: shop.description || shop.title,
          url: location.origin,
        };
        navigator.share(shareData);
      } catch (error) {
        // Ignore share errors
      }
    }
  }

  get canShare() {
    return 'share' in navigator;
  }

  downloadApp() {
    // TODO: Implement download app logic
    // Can link to app store or show download dialog
    alert('لینک دانلود اپلیکیشن به زودی اضافه خواهد شد.');
  }
}

