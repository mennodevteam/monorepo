import { Component, computed, inject, signal } from '@angular/core';

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
import { MatIconModule } from '@angular/material/icon';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { ShopService } from '../../shop/shop.service';

@Component({
  selector: 'app-menu-list',
  standalone: true,
  imports: [
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
    MatIconModule,
    EmptyStateComponent
],
  templateUrl: './list.component.html',
  styleUrl: './list.component.scss',
})
export class MenuListComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly matDialog = inject(MatDialog);

  menuService = inject(MenuService);
  shopService = inject(ShopService);
  
  selectedCategoryId = signal<number | undefined>(
    this.route.snapshot.queryParams['id']
      ? Number(this.route.snapshot.queryParams['id'])
      : this.menuService.categories()?.[0]?.id,
  );

  category = computed(() => {
    if (this.selectedCategoryId()) {
      return this.menuService.categories()?.find((item) => item.id === this.selectedCategoryId());
    }
    return;
  });

  setTab(category: ProductCategory) {
    this.router.navigate(['/menu/list'], { queryParams: { id: category.id } });
    this.selectedCategoryId.set(category.id);
  }

  editCategory(category?: ProductCategory) {
    this.matDialog.open(CategoryFormDialogComponent, {
      data: category,
      width: '360px',
      disableClose: true,
    });
  }

  goToCategories() {
    this.router.navigate(['/menu/categories']);
  }
}
