import { Component, input } from '@angular/core';

import { RouterModule } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  saxHome2Bold,
  saxCategoryBold,
  saxSearchNormal1Bold,
  saxBoxBold,
  saxProfile2userBold,
} from '@ng-icons/iconsax/bold';
import {
  saxHome2Outline,
  saxCategoryOutline,
  saxSearchNormal1Outline,
  saxBoxOutline,
  saxProfile2userOutline,
} from '@ng-icons/iconsax/outline';
import { CommonModule } from '@angular/common';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-bottom-navigation',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    NgIcon,
    MatBadgeModule,
    MatDividerModule,
  ],
  templateUrl: './bottom-navigation.component.html',
  styleUrl: './bottom-navigation.component.scss',
  providers: [
    provideIcons({
      saxHome2Bold,
      saxHome2Outline,
      saxCategoryBold,
      saxCategoryOutline,
      saxSearchNormal1Bold,
      saxSearchNormal1Outline,
      saxBoxBold,
      saxBoxOutline,
      saxProfile2userBold,
      saxProfile2userOutline,
    }),
  ],
})
export class BottomNavigationComponent {
  visible = input(true);
  navItems = [
    { path: '/', label: 'خانه', icon: saxHome2Outline, activeIcon: saxHome2Bold, exact: true },
    { path: '/categories', label: 'دسته‌بندی‌ها', icon: saxCategoryOutline, activeIcon: saxCategoryBold },
    { path: '/search', label: 'جستجو', icon: saxSearchNormal1Outline, activeIcon: saxSearchNormal1Bold },
    { path: '/orders', label: 'سفارشات', icon: saxBoxOutline, activeIcon: saxBoxBold },
    { path: '/main-menu', label: 'پروفایل', icon: saxProfile2userOutline, activeIcon: saxProfile2userBold },
  ];
}
