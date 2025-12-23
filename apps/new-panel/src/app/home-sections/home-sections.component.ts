import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HomeSectionsService } from './home-sections.service';
import { TranslateService } from '@ngx-translate/core';
import { HomeSection, HomeSectionType, ProductListConfig, CategoryListConfig } from '@menno/types';
import { ActivatedRoute, Router } from '@angular/router';
import { SHARED } from '../shared';
import { EmptyStateComponent } from '../shared/components/empty-state/empty-state.component';
import { DialogService } from '../core/services/dialog.service';

const COLS = ['index', 'type', 'title', 'visible', 'actions'];

@Component({
  selector: 'app-home-sections',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatToolbarModule,
    MatCardModule,
    MatTableModule,
    MatChipsModule,
    MatButtonModule,
    MatIconModule,
    MatSlideToggleModule,
    MatMenuModule,
    MatTooltipModule,
    EmptyStateComponent,
  ],
  templateUrl: './home-sections.component.html',
  styleUrl: './home-sections.component.scss',
})
export class HomeSectionsComponent {
  private readonly dialog = inject(DialogService);
  private readonly t = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly homeSectionsService = inject(HomeSectionsService);
  readonly displayedColumns = COLS;
  readonly HomeSectionType = HomeSectionType;

  readonly sections = computed(() => this.homeSectionsService.homeSections());

  addSection(type: HomeSectionType) {
    if (type === HomeSectionType.Banner) {
      this.router.navigate(['./banner'], { relativeTo: this.route });
    } else if (type === HomeSectionType.ProductList) {
      this.router.navigate(['./product-list'], { relativeTo: this.route });
    } else if (type === HomeSectionType.CategoryList) {
      this.router.navigate(['./category-list'], { relativeTo: this.route });
    }
  }

  editSection(section: HomeSection) {
    if (section.type === HomeSectionType.Banner) {
      this.router.navigate(['./banner', section.id], { 
        relativeTo: this.route,
        state: { section }
      });
    } else if (section.type === HomeSectionType.ProductList) {
      this.router.navigate(['./product-list', section.id], { 
        relativeTo: this.route,
        state: { section }
      });
    } else if (section.type === HomeSectionType.CategoryList) {
      this.router.navigate(['./category-list', section.id], { 
        relativeTo: this.route,
        state: { section }
      });
    }
  }

  async deleteSection(section: HomeSection) {
    const confirmed = (await this.dialog.alert(
      this.t.instant('app.confirmDelete'),
      this.t.instant('app.deleteConfirmMessage', { value: this.getSectionTitle(section) }),
      { config: { data: { confirm: true } } },
    )) as boolean | undefined;

    if (confirmed) {
      this.homeSectionsService.deleteMutation.mutate(section.id);
    }
  }

  toggleVisibility(section: HomeSection) {
    this.homeSectionsService.toggleVisibilityMutation.mutate({
      id: section.id,
      isVisible: !section.isVisible,
    });
  }

  openSortDialog() {
    const sections = this.sections();
    if (sections) {
      const sortPromise = this.dialog.sort(
        this.t.instant('homeSections.sortSections'),
        sections.map((item) => ({ id: item.id, text: this.getSectionTitle(item) })),
      ) as Promise<{ id: string; text: string }[] | undefined>;
      sortPromise.then((data) => {
        if (data) {
          const ids = data.map((x) => x.id);
          this.homeSectionsService.reorderMutation.mutate(ids);
        }
      });
    }
  }

  getSectionTitle(section: HomeSection): string {
    if (section.type === HomeSectionType.Banner) {
      return 'Banner';
    } else if (section.type === HomeSectionType.ProductList) {
      const config = section.config as ProductListConfig;
      return config.title || 'Product List';
    } else if (section.type === HomeSectionType.CategoryList) {
      const config = section.config as CategoryListConfig;
      return config.title || 'Category List';
    }
    return section.type;
  }
}

