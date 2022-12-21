import { Component, Input } from '@angular/core';
import { ProductCategory } from '@menno/types';

@Component({
  selector: 'menu-category-container',
  templateUrl: './menu-category-container.component.html',
  styleUrls: ['./menu-category-container.component.scss'],
})
export class MenuCategoryContainerComponent {
  @Input() category: ProductCategory;
}
