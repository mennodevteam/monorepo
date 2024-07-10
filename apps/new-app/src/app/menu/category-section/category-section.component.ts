import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCategory } from '@menno/types';
import { COMMON } from '../../common';
import { ProductListViewComponent } from "../product-list/product-list-view/product-list-view.component";
import { ProductGridViewComponent } from "../product-list/product-grid-view/product-grid-view.component";
import { ProductCardViewComponent } from "../product-list/product-card-view/product-card-view.component";

@Component({
  selector: 'app-category-section',
  standalone: true,
  imports: [CommonModule, COMMON, ProductListViewComponent, ProductGridViewComponent, ProductCardViewComponent],
  templateUrl: './category-section.component.html',
  styleUrl: './category-section.component.scss',
})
export class CategorySectionComponent {
  @Input() category: ProductCategory;
}
