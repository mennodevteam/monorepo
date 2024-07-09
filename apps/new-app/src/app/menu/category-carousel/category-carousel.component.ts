import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  QueryList,
  ViewChildren,
  computed,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Menu } from '@menno/types';
import { COMMON } from '../../common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButton } from '@angular/material/button';
import { debounceSignal } from '../../core';

@Component({
  selector: 'app-category-carousel',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, COMMON],
  templateUrl: './category-carousel.component.html',
  styleUrl: './category-carousel.component.scss',
})
export class CategoryCarouselComponent implements AfterViewInit {
  @ViewChildren(MatButton) categoryButtons: QueryList<MatButton>;
  @Input() menu: Menu;
  @Input() selectedIndex = signal(0);
  isObserverDisabled = signal(false);
  debounceSelectedIndex = debounceSignal(this.selectedIndex, 300);
  selectedTarget = computed(() => {
    const element = this.categoryButtons.get(this.debounceSelectedIndex())?._elementRef.nativeElement;
    return element;
  });

  constructor() {
    effect(() => {
      const element = this.selectedTarget();
      if (element && !this.isObserverDisabled()) {
        element.scrollIntoView({
          behavior: 'smooth',
          inline: 'center',
          block: 'nearest',
        });
      }
    });
  }

  ngAfterViewInit(): void {
    const observer = new IntersectionObserver(
      (entries, observer) => {
        if (this.isObserverDisabled()) return;
        const intersected = entries.filter((elem) => elem.isIntersecting === true)[0];
        if (intersected) {
          this.sections.forEach((t, index) => {
            if (t === intersected.target) {
              this.selectedIndex.set(index);
            }
          });
        }
      },
      {
        rootMargin: '-200px',
      }
    );

    this.sections.forEach((element) => {
      if (element) observer.observe(element);
    });
  }

  selectCategory(index: number) {
    this.isObserverDisabled.set(true);
    setTimeout(() => {
      this.isObserverDisabled.set(false);
    }, 1300);
    this.selectedIndex.set(index);
    this.sections.item(index).scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  get sections() {
    return document.querySelectorAll('section.category-section');
  }
}
