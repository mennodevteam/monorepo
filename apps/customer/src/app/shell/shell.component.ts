import { Component, OnInit, inject, signal } from '@angular/core';

import {
  RouterModule,
  Router,
  NavigationStart,
  NavigationEnd,
  NavigationCancel,
  NavigationError,
  ActivatedRoute,
} from '@angular/router';

import { BottomNavigationComponent } from '../shared/components/bottom-navigation/bottom-navigation.component';
import { TopAppBarComponent } from '../shared/components/top-app-bar/top-app-bar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterModule, BottomNavigationComponent, TopAppBarComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  loading = signal(false);
  hideBottomNav = signal(false);

  ngOnInit(): void {
    // Handle loading state
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.loading.set(true);
      } else if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.loading.set(false);
      }
    });

    // Check route data for hideBottomNav flag
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.checkRoute();
      }
    });

    // Initial check
    this.checkRoute();
  }

  private checkRoute(): void {
    let currentRoute: ActivatedRoute | null = this.router.routerState.root;
    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }

    let rootPage = false;
    let hideBottomNav: boolean | undefined = undefined;

    while (currentRoute) {
      if (!rootPage && currentRoute.snapshot.data['isRootPage'] === true) {
        rootPage = true;
      }

      if (hideBottomNav === undefined && currentRoute.snapshot.data['hideBottomNav'] !== undefined) {
        hideBottomNav = currentRoute.snapshot.data['hideBottomNav'];
      }

      currentRoute = currentRoute.parent;
    }

    this.hideBottomNav.set(hideBottomNav || false);
  }
}
