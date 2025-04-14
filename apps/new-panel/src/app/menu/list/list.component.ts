import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { MenuService } from '../menu.service';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MenuCategoryComponent } from './category/category.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { ProductCategory } from '@menno/types';
import { DialogService } from '../../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { CategoryFormDialogComponent } from '../category-form-dialog/category-form-dialog.component';
import { MatTabsModule } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
@Component({
  selector: 'app-menu-list',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatListModule,
    MatCardModule,
    MenuCategoryComponent,
    MatToolbarModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatChipsModule,
    MatTabsModule,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class MenuListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  menuService = inject(MenuService);
  selectedCategoryId = signal<number | undefined>(
    this.route.snapshot.queryParams['id']
      ? Number(this.route.snapshot.queryParams['id'])
      : this.menuService.categories()?.[0].id,
  );

  category = computed(() => {
    if (this.selectedCategoryId()) {
      return this.menuService.categories()?.find((item) => item.id === this.selectedCategoryId());
    }
    return;
  });

  setTab(category: ProductCategory) {
    this.router.navigate(['.'], { queryParams: { id: category.id } });
    this.selectedCategoryId.set(category.id);
  }

  // scrollTo(category: ProductCategory) {
  //   const categoryElement = document.getElementById('category_' + category.id);
  //   if (categoryElement) categoryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  // }

  // openSortCategoriesDialog() {
  //   const categories = this.menuService.categories();
  //   if (categories)
  //     this.dialog
  //       .sort(
  //         this.t.instant('menu.sortCategories'),
  //         categories.map((item) => ({ id: item.id, text: item.title })),
  //       )
  //       .then((data) => {
  //         if (data) this.menuService.sortCategoriesMutation.mutate(data.map((x: ProductCategory) => x.id));
  //       });
  // }

  // editCategory(category?: ProductCategory) {
  //   this.matDialog.open(CategoryFormDialogComponent, {
  //     data: category,
  //     width: '360px',
  //     disableClose: true,
  //   });
  // }
}
