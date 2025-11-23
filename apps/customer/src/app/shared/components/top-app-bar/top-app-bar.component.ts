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

  private readonly shopService = inject(ShopService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly location = inject(Location);

  readonly shopTitle = computed(() => this.shopService.data()?.title ?? '');
  readonly shopLogoUrl = computed(() => {
    const data = this.shopService.data();
    return data?.logoImage?.md ?? data?.logo ?? '';
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

    // Traverse back up to check for isRootPage data
    while (currentRoute) {
      if (currentRoute.snapshot.data['isRootPage'] === true) {
        isRoot = true;
        break;
      }
      currentRoute = currentRoute.parent;
    }

    this.isRootPage.set(isRoot);
  }

  goBack(): void {
    this.location.back();
  }
}
