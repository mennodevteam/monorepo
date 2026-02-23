import { Component, computed, inject } from '@angular/core';
import { HomeSectionType } from '@menno/types';
import { HomeSectionService } from '../../core/services/home-section.service';
import { BannerComponent } from '../../shared/components/banner/banner.component';
import { ProductListComponent } from '../../shared/components/product-list/product-list.component';
import { CategoryListComponent } from '../../shared/components/category-list/category-list.component';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, BannerComponent, ProductListComponent, CategoryListComponent, MatProgressSpinnerModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly homeSectionService = inject(HomeSectionService);

  readonly sections = this.homeSectionService.data;
  readonly isLoading = computed(() => this.homeSectionService.homeSectionsQuery.isLoading());
  readonly isFirstSectionBanner = computed(
    () => this.sections()[0]?.type === HomeSectionType.Banner
  );
  readonly HomeSectionType = HomeSectionType;
}
