import { Component, DestroyRef, OnInit, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter } from 'rxjs';
import { HomeSectionService } from './core/services/home-section.service';
import { ShopService } from './core/services/shop.service';
import { resolveShopUsername } from './core/functions';
import { WelcomeMessageDialogComponent } from './shared/components/welcome-message-dialog/welcome-message-dialog.component';

@Component({
  standalone: true,
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'customer';
  private readonly homeSectionService = inject(HomeSectionService);
  private readonly shopService = inject(ShopService);
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);

  private welcomeTimerId: ReturnType<typeof setTimeout> | undefined;
  private hasShownWelcomePopup = false;

  constructor() {
    effect(() => {
      this.shopService.data();
      this.tryShowWelcomePopup();
    });
  }

  ngOnInit(): void {
    this.homeSectionService.prefetchHomeSections(resolveShopUsername());
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.tryShowWelcomePopup();
      });
    this.tryShowWelcomePopup();
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

      this.hasShownWelcomePopup = true;
      this.dialog.open(WelcomeMessageDialogComponent, {
        panelClass: 'visible-overflow',
      });
    }, delayMs);
  }

  private currentPath() {
    return this.router.url.split('?')[0];
  }

  private isWelcomeRoute(path: string) {
    return path === '/home' || path.startsWith('/categories');
  }
}
