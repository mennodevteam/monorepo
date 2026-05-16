import { Component, computed, effect, inject } from '@angular/core';
import { HomeSectionType, Menu, Product, ProductCategory } from '@menno/types';
import { HomeSectionService } from '../../core/services/home-section.service';
import { MenuService } from '../../core/services/menu.service';
import { LinkService } from '../../core/services/link.service';
import { BannerComponent } from '../../shared/components/banner/banner.component';
import { ProductListComponent } from '../../shared/components/product-list/product-list.component';
import { CategoryListComponent } from '../../shared/components/category-list/category-list.component';
import { SectionComponent } from '../../shared/components/section/section.component';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatGridListModule } from '@angular/material/grid-list';
import { RouterLink } from '@angular/router';
import { ImageLoaderDirective } from '../../shared/directives/image-loader.directive';
import { resolveShopUsername } from '../../core/functions';
import { ShopService } from '../../core/services/shop.service';
import { SeoService } from '../../core/services/seo.service';
import { buildHomePageSeo } from '../../core/seo/page-seo.builder';

const FALLBACK_PRODUCT_COUNT = 20;

/** یک‌بار per اسپا لود؛ با رفرش کامل صفحه صفر می‌شود و ترتیب محصولات دوباره تصادفی می‌شود. */
let fallbackProductsPickCache: { menuKey: string; productIds: string[] } | null = null;

function menuFallbackCacheKey(shopUsername: string, menu: Menu): string {
  return `${shopUsername}:${menu.id ?? ''}`;
}

function productHasMainImage(product: Product): boolean {
  return !!Product.mainImageFile(product);
}

/** Deterministic product pick for stable SSR hydration and SEO. */
function pickFallbackProducts(menu: Menu, shopUsername: string): Product[] {
  const key = menuFallbackCacheKey(shopUsername, menu);
  if (!fallbackProductsPickCache || fallbackProductsPickCache.menuKey !== key) {
    const all = Menu.getProductList(menu);
    const withImage = all.filter((p) => productHasMainImage(p));
    const withoutImage = all.filter((p) => !productHasMainImage(p));
    const sorted = [...withImage, ...withoutImage].sort((a, b) =>
      (a.title ?? a.id ?? '').localeCompare(b.title ?? b.id ?? '', 'fa'),
    );
    const picked = sorted.slice(0, FALLBACK_PRODUCT_COUNT);
    fallbackProductsPickCache = { menuKey: key, productIds: picked.map((p) => p.id) };
  }
  return fallbackProductsPickCache.productIds
    .map((id) => Menu.getProductById(menu, id))
    .filter((p): p is Product => p != null);
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    BannerComponent,
    ProductListComponent,
    CategoryListComponent,
    SectionComponent,
    MatProgressSpinnerModule,
    MatGridListModule,
    RouterLink,
    ImageLoaderDirective,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent {
  private readonly shopUsername = resolveShopUsername();
  readonly homeSectionService = inject(HomeSectionService);
  private readonly menuService = inject(MenuService);
  private readonly linkService = inject(LinkService);
  private readonly shopService = inject(ShopService);
  private readonly seoService = inject(SeoService);

  readonly sections = this.homeSectionService.data;

  constructor() {
    effect(() => {
      const shop = this.shopService.data();
      if (shop) {
        this.seoService.applyPageSeo(buildHomePageSeo(shop));
      }
    });
  }
  readonly isLoading = computed(() => this.homeSectionService.homeSectionsQuery.isLoading());
  readonly menuLoading = computed(() => this.menuService.menuQuery.isLoading());

  readonly hasConfiguredSections = computed(() => this.sections().length > 0);

  readonly fallbackCategories = computed(() => this.menuService.data()?.categories ?? []);
  readonly fallbackProducts = computed(() => {
    const menu = this.menuService.data();
    if (!menu) return [];
    return pickFallbackProducts(menu, this.shopUsername);
  });

  /** Home sections loaded, no CMS sections, menu still loading */
  readonly showFallbackLoading = computed(
    () => !this.isLoading() && !this.hasConfiguredSections() && this.menuLoading(),
  );

  readonly showFallbackHome = computed(() => {
    if (this.isLoading() || this.hasConfiguredSections() || this.menuLoading()) return false;
    return this.fallbackCategories().length > 0 || this.fallbackProducts().length > 0;
  });

  readonly isFirstSectionBanner = computed(
    () => this.sections()[0]?.type === HomeSectionType.Banner,
  );
  readonly HomeSectionType = HomeSectionType;

  categoryDisplayName(category: ProductCategory): string {
    const t = category.title?.trim();
    return t ? t : 'دسته‌بندی';
  }

  getCategoryImage(category: ProductCategory) {
    return category.imageFile ?? undefined;
  }

  getCategoryLink(category: ProductCategory): string {
    return this.linkService.getCategoryLink(category);
  }

  getProductImage(product: Product) {
    return Product.mainImageFile(product) ?? undefined;
  }

  getProductLink(product: Product): string {
    return this.linkService.getProductLink(product);
  }

  productDisplayTitle(product: Product): string {
    const t = product.title?.trim();
    return t ? t : 'محصول';
  }
}
