import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChildrenOutletContexts, RouterModule } from '@angular/router';
import { ClubService } from '../core/services/club.service';
import { PwaService, SeoService, ShopService, routeAnimations } from '../core';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
  animations: [routeAnimations]
})
export class ShellComponent {
  constructor(
    private club: ClubService,
    private shop: ShopService,
    private pwa: PwaService,
    private seo: SeoService,
    private contexts: ChildrenOutletContexts,
  ) {
    const elem: HTMLElement | null = document.querySelector('#pre-load-data-container');
    if (elem) {
      setTimeout(() => {
        elem.style.opacity = '0';
        setTimeout(() => {
          elem.remove();
        }, 320);
      }, 500);
    }
  }

  getRouteAnimationData() {
    return this.contexts.getContext('primary')?.route?.snapshot?.data?.['animation'];
  }
}
