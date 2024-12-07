import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../../shared';
import { MatCardModule } from '@angular/material/card';
import { ProductCategory } from '@menno/types';
import { MatToolbarModule } from '@angular/material/toolbar';
import { ProductTableComponent } from "./table/table.component";

@Component({
  selector: 'app-menu-category',
  standalone: true,
  imports: [CommonModule, SHARED, MatCardModule, MatToolbarModule, ProductTableComponent],
  templateUrl: './category.component.html',
  styleUrl: './category.component.scss',
})
export class MenuCategoryComponent {
  category = input<ProductCategory>();
}
