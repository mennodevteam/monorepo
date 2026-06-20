import { Component, effect, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule, Router } from '@angular/router';
import { SHARED } from '../shared';
import { AuthService } from '../auth/auth.service';
import { MatMenuModule } from '@angular/material/menu';
import { ShopService } from '../shop/shop.service';
import { MenuService } from '../menu/menu.service';
import { signal } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { DialogService } from '../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { NotificationService } from '../core/services/notification.service';
import { MatBadgeModule } from '@angular/material/badge';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  saxHome2Outline,
  saxReceipt2Outline,
  saxCategoryOutline,
  saxBoxOutline,
  saxArchiveOutline,
  saxGlassOutline,
  saxTaskSquareOutline,
  saxDollarSquareOutline,
  saxCalculatorOutline,
  saxPeopleOutline,
  saxTagOutline,
  saxAwardOutline,
  saxChart1Outline,
  saxChart2Outline,
  saxSmsOutline,
  saxCpuOutline,
  saxMobileOutline,
  saxArrowDown2Outline,
  saxArrowLeft2Outline,
  saxShopOutline,
  saxColorfilterOutline,
  saxReceiptItemOutline,
  saxMapOutline,
  saxUserSquareOutline,
  saxKeyOutline,
  saxComponentOutline,
  saxCodeOutline,
  saxLogoutOutline,
  saxNotificationOutline,
  saxMenuOutline,
  saxSetting2Outline,
} from '@ng-icons/iconsax/outline';

@Component({
  selector: 'app-shell',
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  standalone: true,
  imports: [
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatListModule,
    RouterModule,
    MatTooltipModule,
    SHARED,
    RouterModule,
    MatMenuModule,
    MatBadgeModule,
    NgIcon,
  ],
  providers: [
    provideIcons({
      saxHome2Outline,
      saxReceipt2Outline,
      saxCategoryOutline,
      saxBoxOutline,
      saxArchiveOutline,
      saxGlassOutline,
      saxTaskSquareOutline,
      saxDollarSquareOutline,
      saxCalculatorOutline,
      saxPeopleOutline,
      saxTagOutline,
      saxAwardOutline,
      saxChart1Outline,
      saxChart2Outline,
      saxSmsOutline,
      saxCpuOutline,
      saxMobileOutline,
      saxArrowDown2Outline,
      saxArrowLeft2Outline,
      saxShopOutline,
      saxColorfilterOutline,
      saxReceiptItemOutline,
      saxMapOutline,
      saxUserSquareOutline,
      saxKeyOutline,
      saxComponentOutline,
      saxCodeOutline,
      saxLogoutOutline,
      saxNotificationOutline,
      saxMenuOutline,
      saxSetting2Outline,
    }),
  ],
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  readonly shop = inject(ShopService);
  readonly menuService = inject(MenuService);
  readonly notifications = inject(NotificationService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly dialog = inject(DialogService);
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  
  isSmallScreen = signal(false);
  isDrawerClose = signal(false);
  collapse = signal<{ [key: string]: boolean }>({ settings: true, ai: true });

  isBigDataPage(): boolean {
    const url = this.router.url;
    return url.includes('/orders') || 
           url.includes('/menu/list') || 
           url.includes('/inventory') || 
           url.includes('/club') || 
           url.includes('/reports') || 
           url.includes('/coupons') || 
           url.includes('/sms') ||
           url.includes('/pricing');
  }

  constructor() {
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium])
      .subscribe((result) => {
        if (result.matches) this.isDrawerClose.set(true);
        else this.isDrawerClose.set(false);
        this.isSmallScreen.set(result.matches);
      });
  }

  toggleSection(key: string) {
    this.collapse.update((old) => ({ ...old, [key]: !old[key] }));
  }

  async logout() {
    const confirmed = await this.dialog.alert(
      this.translate.instant('shell.confirmTitle'),
      this.translate.instant('shell.confirmMessage'),
    );

    if (confirmed) {
      this.auth.logout();
      window.location.reload();
    }
  }
}
