import { Component, EventEmitter, Output, QueryList, ViewChildren } from '@angular/core';
import { MatChipOption } from '@angular/material/chips';
import { map } from 'rxjs';
import { DataService } from '../../data.service';

@Component({
  selector: 'menu-categories',
  templateUrl: './menu-categories.component.html',
  styleUrls: ['./menu-categories.component.scss'],
})
export class MenuCategoriesComponent {
  @ViewChildren('categoryChip') categoryChips: QueryList<MatChipOption>;
  @Output() chipClick = new EventEmitter<number>();
  constructor(private data: DataService) {}

  get categories() {
    return this.data.menu.pipe(map((x) => x?.categories));
  }

  selectChip(index: number) {
    const selectedChip = this.categoryChips.toArray()[index];

    selectedChip.select();
  }

}
