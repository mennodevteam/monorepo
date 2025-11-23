import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatGridListModule } from '@angular/material/grid-list';
import { RouterLink } from '@angular/router';
import { MenuService } from '../../core/services/menu.service';
import { ImageLoaderDirective } from '../../shared/directives';

@Component({
  selector: 'app-categories',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatGridListModule, RouterLink, ImageLoaderDirective],
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
