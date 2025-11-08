import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { ProductCategory, Status } from '@menno/types';

type CategoryListView = 'list' | 'grid';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [MatCardModule],
  templateUrl: './category-list.component.html',
  styleUrl: './category-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'app-category-list',
  },
})
export class CategoryListComponent {
  readonly categories = input<ProductCategory[]>([]);
  readonly maxItems = input<number | undefined>();
  readonly view = input<CategoryListView>('list');

  private readonly statusLabels: Record<Status, string> = {
    [Status.Inactive]: 'غیرفعال',
    [Status.Active]: 'فعال',
    [Status.Pending]: 'در انتظار',
    [Status.Blocked]: 'مسدود',
  };

  readonly visibleCategories = computed(() => {
    const categories = this.categories();
    const maxItems = this.maxItems();

    if (!maxItems || maxItems < 0) {
      return categories;
    }

    return categories.slice(0, maxItems);
  });

  readonly isGrid = computed(() => this.view() === 'grid');

  protected statusLabel(status?: Status) {
    if (status == null) {
      return '';
    }

    return this.statusLabels[status] ?? '';
  }
}
