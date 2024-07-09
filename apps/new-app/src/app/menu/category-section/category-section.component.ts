import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCategory } from '@menno/types';
import { COMMON } from '../../common';
import { ProductListViewComponent } from "../product/product-list-view/product-list-view.component";

@Component({
  selector: 'app-category-section',
  standalone: true,
  imports: [CommonModule, COMMON, ProductListViewComponent],
  templateUrl: './category-section.component.html',
  styleUrl: './category-section.component.scss',
})
export class CategorySectionComponent {
  @Input() category: ProductCategory;
}
