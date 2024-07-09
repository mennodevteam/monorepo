import { AfterViewInit, Component, Input, signal } from '@angular/core';
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
export class CategoryCarouselComponent implements AfterViewInit {
  @Input() menu: Menu;
  @Input() selectedIndex = signal(0);

  constructor() {}

  ngAfterViewInit(): void {
    const observer = new IntersectionObserver(
      (entries, observer) => {
        const intersected = entries.filter((elem) => elem.isIntersecting === true)[0];
        if (intersected) {
          const targets = document.querySelectorAll('section.category-section h2');
          targets.forEach((t, index) => {
            if (t === intersected.target) this.selectedIndex.set(index);
          });
        }
      },
      {
        rootMargin: '-200px',
      }
    );

    const targets = document.querySelectorAll('section.category-section h2');
    targets.forEach((element) => {
      if (element) observer.observe(element);
    });
  }

  selectCategory(index: number) {
    this.selectedIndex.set(index);
  }
}
