import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  saxHome2Bold,
  saxCategoryBold,
  saxBagBold,
  saxBoxBold,
  saxProfile2userBold,
} from '@ng-icons/iconsax/bold';
import {
  saxHome2Outline,
  saxCategoryOutline,
  saxBagOutline,
  saxBoxOutline,
  saxProfile2userOutline,
} from '@ng-icons/iconsax/outline';
import { CartService } from '../../../core/services/cart.service';

@Component({
  selector: 'app-bottom-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule, MatToolbarModule, MatButtonModule, NgIcon, MatBadgeModule],
  templateUrl: './bottom-navigation.component.html',
  styleUrl: './bottom-navigation.component.scss',
  providers: [
    provideIcons({
      saxHome2Bold,
      saxHome2Outline,
      saxCategoryBold,
      saxCategoryOutline,
      saxBagBold,
      saxBagOutline,
      saxBoxBold,
      saxBoxOutline,
      saxProfile2userBold,
      saxProfile2userOutline,
    }),
  ],
})
export class BottomNavigationComponent {
  cart = inject(CartService);
  navItems = [
    { path: '/home', label: 'خانه', icon: saxHome2Outline, activeIcon: saxHome2Bold },
    { path: '/categories', label: 'دسته‌بندی‌ها', icon: saxCategoryOutline, activeIcon: saxCategoryBold },
    { path: '/cart', label: 'سبد خرید', icon: saxBagOutline, activeIcon: saxBagBold },
    { path: '/orders', label: 'سفارشات', icon: saxBoxOutline, activeIcon: saxBoxBold },
    { path: '/profile', label: 'پروفایل', icon: saxProfile2userOutline, activeIcon: saxProfile2userBold },
  ];
}
