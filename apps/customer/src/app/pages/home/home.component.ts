import { Component, computed, inject } from '@angular/core';
import { HomeSectionType } from '@menno/types';
import { HomeSectionService } from '../../core/services/home-section.service';
import { BannerComponent } from '../../shared/components/banner/banner.component';
import { ProductListComponent } from '../../shared/components/product-list/product-list.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, BannerComponent, ProductListComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  readonly homeSectionService = inject(HomeSectionService);

  readonly sections = this.homeSectionService.data;
  readonly isLoading = computed(() => this.homeSectionService.homeSectionsQuery.isLoading());
  readonly HomeSectionType = HomeSectionType;
}
