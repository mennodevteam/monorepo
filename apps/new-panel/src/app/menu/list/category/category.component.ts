import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../../shared';
import { MatCardModule } from '@angular/material/card';
import { ProductCategory, Status } from '@menno/types';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ProductTableComponent } from './table/table.component';
import { MenuStatusChipComponent } from '../../status-chip/status-chip.component';
import { MenuService } from '../../menu.service';

@Component({
  selector: 'app-menu-category',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatCardModule,
    MatToolbarModule,
    ProductTableComponent,
    MenuStatusChipComponent,
  ],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss',
})
export class MenuCategoryComponent {
  private readonly menu = inject(MenuService);
  category = input<ProductCategory>();
  statusChange(status: Status) {
    this.menu.saveCategoryMutation.mutate({ id: this.category()!.id, status });
  }
}
