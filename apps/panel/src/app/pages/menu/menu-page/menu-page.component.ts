import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MenuService } from '../../../core/services/menu.service';
import { ShopService } from '../../../core/services/shop.service';
import { Product, ProductCategory, Status } from '@menno/types';
import { SortDialogComponent } from '../../../shared/dialogs/sort-dialog/sort-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { MatTabGroup } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { AnalyticsService } from '../../../core/services/analytics.service';

const enum CSVCols {
  Title = 0,
  Description = 1,
  Price = 2,
  Category = 3,
}

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
    private analytics: AnalyticsService,
    private snack: MatSnackBar,
    private translate: TranslateService,
  ) {}

  ngAfterViewInit(): void {
    const selectedTab = this.route.snapshot?.queryParams['category'];
    if (this.tabs && selectedTab) {
      this.tabs.selectedIndex = Number(selectedTab);
    }
  }

  get categories() {
    return this.menuService.categories();
  }

  openSort() {
    this.dialog
      .open(SortDialogComponent, {
        data: this.menuService.categories().map((x) => ({ key: x.id, value: x.title })),
        disableClose: true,
      })
      .afterClosed()
      .subscribe((items) => {
        if (items) {
          this.menuService.sortCategories(items.map((x: any) => x.key));
          this.analytics.event('sort product categories');
        }
      });
  }

  selectedTabChange(index: number) {
    this.router.navigate([], {
      queryParams: { category: index },
      replaceUrl: true,
    });
  }

  importFromCSV(event: any) {
    const input = event.target;

    const reader = new FileReader();
    reader.onload = async () => {
      const text = reader.result;

      if (typeof text === 'string') {
        const lines = text.split(`\n`).splice(1);
        const data: Product[] = [];
        this.snack.open(this.translate.instant('app.saving'), '', { duration: 0 });
        for (const line of lines) {
          if (!line?.trim()) continue;
          const cols = line.split(',');
          if (!cols[CSVCols.Title]) continue;
          let category = this.categories?.find(
            (x) => x.title === (cols[CSVCols.Category] || 'بدون دسته‌بندی'),
          );
          if (!category) {
            category = await this.menuService.saveCategory({
              title: cols[CSVCols.Category] || 'بدون دسته‌بندی',
            });
          }
          data.push({
            title: cols[CSVCols.Title]?.replace(/"/g, ''),
            description: cols[CSVCols.Description]?.replace(/"/g, ''),
            price:
              cols[CSVCols.Price] && !isNaN(Number(cols[CSVCols.Price])) ? Number(cols[CSVCols.Price]) : 0,
            category: { id: category?.id },
          } as Product);
        }
        if (data.length) {
          await this.menuService.saveProducts(data);
        }
        this.snack.dismiss();
      }
    };
    reader.readAsText(input.files[0]);
  }
}
