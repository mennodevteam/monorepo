import { Component, effect, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { SHARED } from '../shared';
import { AuthService } from '../auth/auth.service';
import { MatMenuModule } from '@angular/material/menu';
import { ShopService } from '../shop/shop.service';
import { MenuService } from '../menu/menu.service';
import { signal } from '@angular/core';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { DialogService } from '../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';

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
  ],
})
export class ShellComponent {
  readonly auth = inject(AuthService);
  readonly shop = inject(ShopService);
  readonly menuService = inject(MenuService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly dialog = inject(DialogService);
  private readonly translate = inject(TranslateService);
  isSmallScreen = signal(false);
  isDrawerClose = signal(false);
  collapse = signal<{ [key: string]: boolean }>({ settings: true });

  constructor() {
    this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium]).subscribe((result) => {
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
