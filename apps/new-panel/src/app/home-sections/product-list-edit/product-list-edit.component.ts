import { Component, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HomeSectionsService } from '../home-sections.service';
import { MenuService } from '../../menu/menu.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HomeSection, HomeSectionType, ProductListConfig, ProductListViewType, Product, Menu } from '@menno/types';
import { FormComponent } from '../../core/guards/dirty-form-deactivator.guard';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogService } from '../../core/services/dialog.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray, CdkDragHandle } from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-product-list-edit',
  standalone: true,
  imports: [
    SHARED,
    ReactiveFormsModule,
    FormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatListModule,
    MatIconModule,
    MatAutocompleteModule,
    EmptyStateComponent,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
  ],
  templateUrl: './product-list-edit.component.html',
  styleUrl: './product-list-edit.component.scss',
})
export class ProductListEditComponent implements FormComponent {
  private readonly homeSectionsService = inject(HomeSectionsService);
  private readonly menuService = inject(MenuService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly location = inject(PlatformLocation);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(DialogService);
  private readonly snack = inject(MatSnackBar);
  private readonly t = inject(TranslateService);

  private readonly initialized = signal(false);
  private readonly sectionId = signal<string | null>(
    this.route.snapshot.paramMap.get('id') || null,
  );
  section = signal<HomeSection | null>(null);
  readonly ProductListViewType = ProductListViewType;

  readonly form = this.fb.group({
    viewType: this.fb.control<ProductListViewType>(ProductListViewType.Carousel, {
      validators: [Validators.required],
      nonNullable: true,
    }),
    title: this.fb.control(''),
    productIds: this.fb.control<string[]>([], { validators: [Validators.required], nonNullable: true }),
  });

  readonly allProducts = this.menuService.data;
  searchProductInput = signal<string>('');

  readonly filteredProducts = computed(() => {
    const menu = this.allProducts();
    if (!menu || !menu.categories) return [];
    const selectedIds = this.form.controls.productIds.value;
    const searchQuery = this.searchProductInput().toLowerCase();
    const products: { product: Product; category: { title: string } }[] = [];
    
    for (const cat of menu.categories) {
      if (cat.products) {
        for (const product of cat.products) {
          // Filter out already selected products and match search query
          if (!selectedIds.includes(product.id) && product.title.toLowerCase().includes(searchQuery)) {
            products.push({ product, category: { title: cat.title } });
          }
        }
      }
    }
    return products;
  });

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.sectionId.set(params.get('id') || null);
      this.initialized.set(false);
    });

    effect(() => {
      const sections = this.homeSectionsService.homeSections();
      const menu = this.allProducts();
      if (!sections || !menu || this.initialized()) return;

      const existing = this.sectionId()
        ? sections.find((item) => item.id === this.sectionId())
        : undefined;

      this.section.set(existing ?? null);

      const config = existing?.config as ProductListConfig | undefined;

      this.form.patchValue({
        viewType: config?.viewType || ProductListViewType.Carousel,
        title: config?.title || '',
        productIds: config?.productIds || [],
      });

      this.form.markAsPristine();
      this.initialized.set(true);
    });
  }

  getProductById(id: string): Product | undefined {
    const menu = this.allProducts();
    if (!menu) return undefined;
    return Menu.getProductById(menu, id) || undefined;
  }

  getCategoryForProduct(productId: string): string | undefined {
    const menu = this.allProducts();
    if (!menu || !menu.categories) return undefined;
    
    for (const cat of menu.categories) {
      if (cat.products?.some((p) => p.id === productId)) {
        return cat.title;
      }
    }
    return undefined;
  }

  selectProduct(item: { product: Product; category: { title: string } }) {
    const current = this.form.controls.productIds.value;
    if (!current.includes(item.product.id)) {
      this.form.controls.productIds.setValue([...current, item.product.id]);
      this.form.markAsDirty();
    }
    this.searchProductInput.set('');
  }

  removeProduct(productId: string) {
    const current = this.form.controls.productIds.value;
    this.form.controls.productIds.setValue(current.filter((id) => id !== productId));
    this.form.markAsDirty();
  }

  moveProduct(event: CdkDragDrop<string[]>) {
    const current = this.form.controls.productIds.value;
    const newOrder = [...current];
    moveItemInArray(newOrder, event.previousIndex, event.currentIndex);
    this.form.controls.productIds.setValue(newOrder);
    this.form.markAsDirty();
  }

  async submit() {
    if (this.form.invalid) return;

    const fv = this.form.getRawValue();
    const config: ProductListConfig = {
      viewType: fv.viewType,
      productIds: fv.productIds,
      title: fv.title || undefined,
    };

    const section: HomeSection = {
      id: this.sectionId() || undefined,
      type: HomeSectionType.ProductList,
      config,
      position: 0,
      isVisible: true,
    } as HomeSection;

    await this.homeSectionsService.saveMutation.mutateAsync(section);
    this.form.markAsPristine();
    this.router.navigate(['/home-sections']);
  }

  canDeactivate() {
    return !this.form.dirty;
  }
}

