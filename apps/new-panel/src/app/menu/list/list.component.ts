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
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

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
    CdkDropList,
    CdkDrag,
  ],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class MenuListComponent {
  searchInput = signal('');
  menuService = inject(MenuService);
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

  moveCategory(event: CdkDragDrop<any>) {
    const categories = this.categories();
    if (categories) {
      moveItemInArray(categories, event.previousIndex, event.currentIndex);
      const ids = categories.map((x) => x.id);
      this.menuService.sortCategoriesMutation.mutate(ids);
    }
  }
}
