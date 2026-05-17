import { Component, DestroyRef, OnInit, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { HomeSectionService } from './core/services/home-section.service';
import { MenuService } from './core/services/menu.service';
import { ShopService } from './core/services/shop.service';
import { ThemeService } from './core/services/theme.service';
import { ThemeMode } from '@menno/types';
import { resolveShopUsername } from './core/functions';
import { isCrawlablePathname } from './core/seo/crawlable-paths';
import { SeoService } from './core/services/seo.service';
import { WelcomeMessageDialogComponent } from './shared/components/welcome-message-dialog/welcome-message-dialog.component';

@Component({
  standalone: true,
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  private readonly homeSectionService = inject(HomeSectionService);
  private readonly menuService = inject(MenuService);
  private readonly shopService = inject(ShopService);
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly seo = inject(SeoService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  private welcomeTimerId: ReturnType<typeof setTimeout> | undefined;
  private hasShownWelcomePopup = false;

  constructor() {
    effect(() => {
      const shop = this.shopService.data();
      const themeColor = shop?.appConfig?.themeHex || shop?.appConfig?.theme?.primaryColor;
      if (themeColor) {
        this.themeService.setTheme({
          mode: shop?.appConfig?.themeMode === ThemeMode.Dark ? 'dark' : 'light',
          mainColor: themeColor,
        });
      }
      this.tryShowWelcomePopup();
    });
  }

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      const username = resolveShopUsername();
      void this.menuService.prefetchMenu(username);
      void this.shopService.prefetchShop(username);
      void this.homeSectionService.prefetchHomeSections(username);
    }

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.updateRobotsMeta();
        this.tryShowWelcomePopup();
      });

    this.updateRobotsMeta();
    this.tryShowWelcomePopup();
  }

  private updateRobotsMeta(): void {
    if (!isCrawlablePathname(this.currentPath())) {
      this.seo.setNoIndex();
    }
  }

  private tryShowWelcomePopup() {
    if (this.hasShownWelcomePopup || this.welcomeTimerId !== undefined) {
      return;
    }

    const welcomeMessage = this.shopService.data()?.appConfig?.welcomeMessage;
    if (!welcomeMessage?.enabled || !this.isWelcomeRoute(this.currentPath())) {
      return;
    }

    const delayMs = Math.max(0, (welcomeMessage.delayInSeconds || 0) * 1000);
    this.welcomeTimerId = setTimeout(() => {
      this.welcomeTimerId = undefined;

      if (this.hasShownWelcomePopup || !this.isWelcomeRoute(this.currentPath())) {
        return;
      }

      this.openWelcomeDialog();
    }, delayMs);
  }

  private openWelcomeDialog() {
    if (this.hasShownWelcomePopup) {
      return;
    }
    this.hasShownWelcomePopup = true;
    this.dialog.open(WelcomeMessageDialogComponent, {
      panelClass: 'visible-overflow',
    });
  }

  private currentPath() {
    return this.router.url.split('?')[0];
  }

  private isWelcomeRoute(path: string) {
    return path === '/' || path === '/home' || path.startsWith('/categories');
  }
}
