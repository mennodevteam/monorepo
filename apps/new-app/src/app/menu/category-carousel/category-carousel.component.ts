import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  QueryList,
  ViewChild,
  ViewChildren,
  computed,
  effect,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Menu } from '@menno/types';
import { COMMON } from '../../common';
import { MatToolbar, MatToolbarModule } from '@angular/material/toolbar';
import { MatButton } from '@angular/material/button';
import { MenuService, debounceSignal } from '../../core';

@Component({
  selector: 'app-category-carousel',
  standalone: true,
  imports: [CommonModule, MatToolbarModule, COMMON],
  templateUrl: './category-carousel.component.html',
  styleUrl: './category-carousel.component.scss',
})
export class CategoryCarouselComponent implements AfterViewInit {
  @ViewChildren(MatButton) categoryButtons: QueryList<MatButton>;
  @ViewChild(MatToolbar) carousel: MatToolbar;
  @Input() selectedIndex = signal(0);
  isCarouselStick = signal(false);
  isObserverDisabled = signal(false);
  debounceSelectedIndex = debounceSignal(this.selectedIndex, 300);
  selectedTarget = computed(() => {
    const element = this.categoryButtons.get(this.debounceSelectedIndex())?._elementRef.nativeElement;
    return element;
  });
  bigIcon = this.menuService.categories().find((x) => !x.faIcon) == undefined;

  constructor(public menuService: MenuService) {
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
    const sectionObserver = new IntersectionObserver(
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
      },
    );

    this.sections.forEach((element) => {
      if (element) sectionObserver.observe(element);
    });

    const carouselObserver = new IntersectionObserver(
      (entries) => {
        this.isCarouselStick.set(Boolean(entries[0]?.isIntersecting) === false);
      },
      { threshold: 1 },
    );

    carouselObserver.observe(this.carousel['_elementRef'].nativeElement);
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
