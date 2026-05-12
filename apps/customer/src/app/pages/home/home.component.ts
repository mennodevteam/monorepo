import { Component, computed, inject } from '@angular/core';
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

const FALLBACK_PRODUCT_COUNT = 20;

/** یک‌بار per اسپا لود؛ با رفرش کامل صفحه صفر می‌شود و ترتیب محصولات دوباره تصادفی می‌شود. */
let fallbackProductsPickCache: { menuKey: string; productIds: string[] } | null = null;

function menuFallbackCacheKey(shopUsername: string, menu: Menu): string {
  return `${shopUsername}:${menu.id ?? ''}`;
}

/** Fisher–Yates shuffle روی کپی آرایه، سپس حداکثر `count` عضو اول. */
function shufflePick<T>(items: readonly T[], count: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
}

function productHasMainImage(product: Product): boolean {
  return !!Product.mainImageFile(product);
}

/** تا `count` محصول تصادفی؛ اول از دارای تصویر اصلی، بعد بقیه برای تکمیل سقف. */
function shufflePickProductsPreferringImages(products: readonly Product[], count: number): Product[] {
  const withImage = products.filter((p) => productHasMainImage(p));
  const withoutImage = products.filter((p) => !productHasMainImage(p));
  const picked = shufflePick(withImage, count);
  if (picked.length >= count) return picked;
  return [...picked, ...shufflePick(withoutImage, count - picked.length)];
}

function getStableFallbackProducts(menu: Menu, shopUsername: string): Product[] {
  const key = menuFallbackCacheKey(shopUsername, menu);
  if (!fallbackProductsPickCache || fallbackProductsPickCache.menuKey !== key) {
    const all = Menu.getProductList(menu);
    const picked = shufflePickProductsPreferringImages(all, FALLBACK_PRODUCT_COUNT);
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

  readonly sections = this.homeSectionService.data;
  readonly isLoading = computed(() => this.homeSectionService.homeSectionsQuery.isLoading());
  readonly menuLoading = computed(() => this.menuService.menuQuery.isLoading());

  readonly hasConfiguredSections = computed(() => this.sections().length > 0);

  readonly fallbackCategories = computed(() => this.menuService.data()?.categories ?? []);
  readonly fallbackProducts = computed(() => {
    const menu = this.menuService.data();
    if (!menu) return [];
    return getStableFallbackProducts(menu, this.shopUsername);
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
