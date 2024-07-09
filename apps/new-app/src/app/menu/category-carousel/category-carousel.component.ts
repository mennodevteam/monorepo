import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Menu } from '@menno/types';
import { COMMON } from '../../common';
import { MatToolbarModule } from '@angular/material/toolbar';

@Component({
  selector: 'app-category-carousel',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, COMMON],
  templateUrl: './category-carousel.component.html',
  styleUrl: './category-carousel.component.scss',
})
export class CategoryCarouselComponent {
  @Input() menu: Menu;
  @Input() selectedIndex = signal(0);

  selectCategory(index: number) {
    this.selectedIndex.set(index);
  }
}
