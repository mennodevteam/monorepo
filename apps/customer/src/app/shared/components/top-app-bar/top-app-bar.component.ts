import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  saxArrowRight1Outline,
  saxInfoCircleOutline,
  saxSearchNormal1Outline,
} from '@ng-icons/iconsax/outline';
import { filter, map } from 'rxjs';
import { ShopService } from '../../../core/services/shop.service';
import { ImageLoaderDirective } from '../../directives';
import { Location } from '@angular/common';
import { TitleService } from '../../../core/services/title.service';

@Component({
  selector: 'app-top-app-bar',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, NgIcon, ImageLoaderDirective],
  templateUrl: './top-app-bar.component.html',
  styleUrl: './top-app-bar.component.scss',
  providers: [
    provideIcons({
      saxSearchNormal1Outline,
      saxInfoCircleOutline,
      saxArrowRight1Outline,
    }),
  ],
})
export class TopAppBarComponent implements OnInit {
  readonly isRootPage = signal<boolean>(true);
  readonly routeTitle = signal<string | undefined>(undefined); // Added routeTitle signal

  private readonly shopService = inject(ShopService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly titleService = inject(TitleService); // Injected TitleService

  readonly shopTitle = computed(() => this.shopService.data()?.title ?? '');
  readonly shopLogoUrl = computed(() => {
    const data = this.shopService.data();
    return data?.logoImage?.md ?? data?.logo ?? '';
  });

  // Added displayTitle computed property
  readonly displayTitle = computed(() => {
    return this.isRootPage() ? this.shopTitle() : this.titleService.title();
  });

  readonly searchIcon = saxSearchNormal1Outline;
  readonly infoIcon = saxInfoCircleOutline;
  readonly backIcon = saxArrowRight1Outline;

  ngOnInit(): void {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.checkRoute();
    });

    // Initial check in case navigation has already completed
    this.checkRoute();
  }

  private checkRoute(): void {
    let currentRoute: ActivatedRoute | null = this.router.routerState.root;

    // Traverse to the leaf route
    while (currentRoute.firstChild) {
      currentRoute = currentRoute.firstChild;
    }

    let isRoot = false;
    let title: string | undefined = undefined; // Added title variable

    // Traverse back up to check for isRootPage data and title
    while (currentRoute) {
      if (currentRoute.snapshot.data['isRootPage'] === true) {
        isRoot = true;
      }
      // Check for title data
      if (!title && currentRoute.snapshot.data['title']) {
        title = currentRoute.snapshot.data['title'];
      }
      currentRoute = currentRoute.parent;
    }

    this.isRootPage.set(isRoot);
    this.routeTitle.set(title); // Set routeTitle
  }

  goBack(): void {
    this.location.back();
  }
}
