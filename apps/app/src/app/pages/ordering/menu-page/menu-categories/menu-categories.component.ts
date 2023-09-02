import { Component, EventEmitter, Output, QueryList, ViewChildren } from '@angular/core';
import { MatChipOption } from '@angular/material/chips';
import { MenuService } from '../../../../core/services/menu.service';

@Component({
  selector: 'menu-categories',
  templateUrl: './menu-categories.component.html',
  styleUrls: ['./menu-categories.component.scss'],
})
export class MenuCategoriesComponent {
  @ViewChildren('categoryChip') categoryChips: QueryList<MatChipOption>;
  @Output() chipClick = new EventEmitter<number>();
  constructor(private menuService: MenuService) {}

  get categories() {
    return this.menuService.menu?.categories;
  }

  selectChip(index: number, scrollIntoView = false) {
    const selectedChip = this.categoryChips.toArray()[index];
    selectedChip.select();
    if (scrollIntoView) {
      setTimeout(() => {
        selectedChip._elementRef.nativeElement.scrollIntoView({
          block: 'nearest',
          inline: 'center',
          behavior: 'smooth',
        });
      }, 300);
    }
  }
}
