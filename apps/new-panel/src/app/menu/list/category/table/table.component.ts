import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductCategory } from '@menno/types';
import { SHARED } from '../../../../shared';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
const COLS = ['index', 'image', 'title', 'price', 'actions'];
@Component({
  selector: 'app-product-table',
  standalone: true,
  imports: [CommonModule, SHARED, MatTableModule, MatChipsModule],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
})
export class ProductTableComponent {
  category = input<ProductCategory>();
  readonly displayedColumns = COLS;
}
