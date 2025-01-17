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
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class MenuListComponent {
  searchInput = signal('');
  menuService = inject(MenuService);
  dialog = inject(DialogService);
  matDialog = inject(MatDialog);
  t = inject(TranslateService);
  categories = computed(() => {
    const query = this.searchInput();
    if (query) {
      return this.menuService
        .categories()
        ?.filter((category) => {
          if (category.title.search(query) >= 0) return true;
          if (category.products?.find((product) => product.title.search(query) >= 0)) return true;
          return false;
        })
        .map((category) => {
          const newCategory = { ...category };
          if (category.title.search(query) >= 0) return newCategory;
          newCategory.products = category.products?.filter((product) => product.title.search(query) >= 0);
          return newCategory;
        });
    }
    return this.menuService.categories();
  });

  scrollTo(category: ProductCategory) {
    const categoryElement = document.getElementById('category_' + category.id);
    if (categoryElement) categoryElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  openSortCategoriesDialog() {
    const categories = this.menuService.categories();
    if (categories)
      this.dialog
        .sort(
          this.t.instant('menu.sortCategories'),
          categories.map((item) => ({ id: item.id, text: item.title })),
        )
        .then((data) => {
          if (data) this.menuService.sortCategoriesMutation.mutate(data.map((x: ProductCategory) => x.id));
        });
  }

  editCategory(category?: ProductCategory) {
    this.matDialog.open(CategoryFormDialogComponent, {
      data: category,
      width: '360px',
      disableClose: true
    });
  }
}
