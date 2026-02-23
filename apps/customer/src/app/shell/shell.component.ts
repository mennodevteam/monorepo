import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';

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
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterModule, BottomNavigationComponent, TopAppBarComponent, MatProgressBarModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);
  @ViewChild('scrollContainer') private scrollContainer?: ElementRef<HTMLElement>;
  private scrollPositions = new Map<string, number>();
  private shouldRestoreScroll = false;

  loading = signal(false);
  hideBottomNav = signal(false);
  hideMetaAction = signal(false);

  constructor() {
    const elem: HTMLElement | null = document.querySelector('#pre-load-data-container');
    if (elem) {
      const removePreload = () => {
        elem.style.opacity = '0';
        setTimeout(() => {
          elem.remove();
        }, 320);
      };

      if ((window as any).__preloadAnimationDone) {
        removePreload();
      } else {
        const onPreloadDone = () => {
          window.removeEventListener('preload-animation-done', onPreloadDone);
          removePreload();
        };
        window.addEventListener('preload-animation-done', onPreloadDone);
      }
    }
  }
  
  ngOnInit(): void {
    // Handle loading state
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.saveScrollPositionForCurrentRoute();
        this.shouldRestoreScroll = event.navigationTrigger === 'popstate';
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
        this.restoreOrResetScroll(event.urlAfterRedirects);
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
    let hideMetaAction: boolean | undefined = undefined;

    while (currentRoute) {
      if (!rootPage && currentRoute.snapshot.data['isRootPage'] === true) {
        rootPage = true;
      }

      if (hideBottomNav === undefined && currentRoute.snapshot.data['hideBottomNav'] !== undefined) {
        hideBottomNav = currentRoute.snapshot.data['hideBottomNav'];
      }

      if (hideMetaAction === undefined && currentRoute.snapshot.data['hideMetaAction'] !== undefined) {
        hideMetaAction = currentRoute.snapshot.data['hideMetaAction'];
      }

      currentRoute = currentRoute.parent;
    }

    this.hideBottomNav.set(hideBottomNav || false);
    this.hideMetaAction.set(hideMetaAction || false);
  }

  private scrollToTop(): void {
    this.scrollContainer?.nativeElement.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    });
  }

  private restoreOrResetScroll(url: string): void {
    const currentRoute = this.getDeepestRoute();
    const shouldPreserve = currentRoute.snapshot.data['preserveScrollOnBack'] === true;

    if (shouldPreserve && this.shouldRestoreScroll) {
      const position = this.scrollPositions.get(this.getScrollKey(url));
      if (position !== undefined) {
        this.restoreScrollPosition(position);
        return;
      }
    }

    this.scrollToTop();
  }

  private saveScrollPositionForCurrentRoute(): void {
    const currentRoute = this.getDeepestRoute();
    const shouldPreserve = currentRoute.snapshot.data['preserveScrollOnBack'] === true;
    const container = this.scrollContainer?.nativeElement;
    if (!shouldPreserve || !container) {
      return;
    }

    this.scrollPositions.set(this.getScrollKey(this.router.url), container.scrollTop);
  }

  private restoreScrollPosition(position: number): void {
    const container = this.scrollContainer?.nativeElement;
    if (!container) {
      return;
    }

    const apply = () =>
      container.scrollTo({
        top: position,
        left: 0,
        behavior: 'auto',
      });

    requestAnimationFrame(apply);
    setTimeout(apply, 120);
  }

  private getDeepestRoute(): ActivatedRoute {
    let currentRoute: ActivatedRoute = this.router.routerState.root;
    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }
    return currentRoute;
  }

  private getScrollKey(url: string): string {
    return url.split('#')[0];
  }
}
