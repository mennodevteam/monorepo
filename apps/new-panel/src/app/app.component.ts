import { Component, inject, signal, computed } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, RouterModule } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { ShopService } from './shop/shop.service';
import { MenuService } from './menu/menu.service';

@Component({
  standalone: true,
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'new-panel';

  private router = inject(Router);
  private authService = inject(AuthService);
  private shopService = inject(ShopService);
  private menuService = inject(MenuService);

  isAdminRoute = signal(false);

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        const url = event.url;
        this.isAdminRoute.set(url.startsWith('/admin') && !url.startsWith('/admin/auth'));
      } else if (event instanceof NavigationEnd) {
        const url = this.router.url;
        this.isAdminRoute.set(url.startsWith('/admin') && !url.startsWith('/admin/auth'));
      }
    });
    // Check initial path on application startup
    const path = window.location.pathname;
    this.isAdminRoute.set(path.startsWith('/admin') && !path.startsWith('/admin/auth'));
  }

  isLoading = computed(() => {
    if (!this.isAdminRoute()) {
      return false;
    }
    // Access the signal to establish a reactive dependency
    const userFromSignal = this.authService.userSignal();
    // Check the synchronous user getter in case the signal is not yet populated but token exists
    if (!userFromSignal && !this.authService.user) {
      return false;
    }
    // We are on an admin route and logged in. Wait for shop and menu data to load.
    return !this.shopService.data() || !this.menuService.data();
  });
}
