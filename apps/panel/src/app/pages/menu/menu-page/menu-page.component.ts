import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MenuService } from '../../../core/services/menu.service';
import { ShopService } from '../../../core/services/shop.service';
import { Status } from '@menno/types';
import { SortDialogComponent } from '../../../shared/dialogs/sort-dialog/sort-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabGroup } from '@angular/material/tabs';
import { MatomoService } from '../../../core/services/matomo.service';

@Component({
  selector: 'menno-menu-page',
  templateUrl: './menu-page.component.html',
  styleUrls: ['./menu-page.component.scss'],
})
export class MenuPageComponent implements AfterViewInit {
  Status = Status;
  @ViewChild(MatTabGroup) tabs: MatTabGroup;
  constructor(
    private menuService: MenuService,
    private dialog: MatDialog,
    private router: Router,
    private route: ActivatedRoute,
    private matomo: MatomoService
  ) {}

  ngAfterViewInit(): void {
    const selectedTab = this.route.snapshot?.queryParams['category'];
    if (this.tabs && selectedTab) {
      this.tabs.selectedIndex = Number(selectedTab);
    }
  }

  get categories() {
    return this.menuService.menu?.categories;
  }

  openSort() {
    this.dialog
      .open(SortDialogComponent, {
        data: this.menuService.menu?.categories?.map((x) => ({ key: x.id, value: x.title })),
        disableClose: true,
      })
      .afterClosed()
      .subscribe((items) => {
        if (items) {
          this.menuService.sortCategories(items.map((x: any) => x.key));
        }
        this.matomo.trackEvent('menu', 'category', 'sort', items != undefined);
      });
  }

  selectedTabChange(index: number) {
    this.router.navigate([], {
      queryParams: { category: index },
      replaceUrl: true,
    });
    this.matomo.trackEvent('menu', 'category', 'select', index);
  }
}
