import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MenuService } from '../../core/services/menu.service';
import { SectionComponent } from '../../shared/components/section/section.component';
import { CategoryListComponent } from '../../shared/components/category-list/category-list.component';
import { RootAppBarComponent } from '../../shared/components/root-app-bar/root-app-bar.component';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    RootAppBarComponent,
    SectionComponent,
    CategoryListComponent,
  ],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesComponent {
  private readonly menuService = inject(MenuService);

  readonly menuQuery = this.menuService.menuQuery;
  readonly categories = computed(() => this.menuService.data()?.categories ?? []);
  readonly hasCategories = computed(() => this.categories().length > 0);
}


