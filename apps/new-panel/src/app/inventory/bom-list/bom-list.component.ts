import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { FormControl, FormsModule, Validators } from '@angular/forms';
import { MaterialsService } from '../materials.service';
import {
  Product,
  ProductVariant,
  Material,
  BillOfMaterial,
  ProductCategory,
  Status,
  BillOfProduct,
} from '@menno/types';
import { MenuService } from '../../menu/menu.service';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { PromptFields } from '../../shared/dialogs/prompt-dialog/prompt-dialog.component';
import { DialogService } from '../../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { ShopService } from '../../shop/shop.service';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';

interface CategoryItem {
  category: ProductCategory;
  items: {
    product: Product;
    variant?: ProductVariant;
    boms: BillOfMaterial[];
    bops: BillOfProduct[];
    cost?: number | null;
  }[];
}

@Component({
  selector: 'app-bom-list',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatFormFieldModule,
    MatAutocompleteModule,
    FormsModule,
    SHARED,
    MatToolbarModule,
    MatCardModule,
    MatMenuModule,
    MatInputModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatSelectModule,
    MatTooltipModule,
  ],
  templateUrl: './bom-list.component.html',
  styleUrl: './bom-list.component.scss',
})
export class BomListComponent {
  displayedColumns: string[] = ['select', 'title', 'materials', 'cost'];
  menuService = inject(MenuService);
  materialsService = inject(MaterialsService);
  dialogService = inject(DialogService);
  translate = inject(TranslateService);
  public shopService = inject(ShopService);

  searchQuery = signal('');
  searchMaterialInput = signal<string>('');
  showInactiveItems = signal(false);
  allProducts = computed(() => {
    const all: { product: Product; variant?: ProductVariant }[] = [];
    const categories = this.menuService.data()?.categories || [];
    for (const category of categories) {
      for (const product of category.products || []) {
        if (product.variants?.length) {
          for (const variant of product.variants) {
            all.push({ product, variant });
          }
        } else {
          all.push({ product });
        }
      }
    }
    return all;
  });
  selectedCategory = signal<number | null>(null);

  /** Group edit: selection key for an item (product + variant) */
  itemKey(item: CategoryItem['items'][number]): string {
    return `${item.product.id}-${item.variant?.id ?? 'base'}`;
  }

  selectedItemKeys = signal<Set<string>>(new Set());

  hasSelection = computed(() => this.selectedItemKeys().size > 0);
  selectedCount = computed(() => this.selectedItemKeys().size);

  /** Selected items (from all categories) for group operations */
  selectedItems = computed(() => {
    const keys = this.selectedItemKeys();
    const items: CategoryItem['items'][number][] = [];
    for (const cat of this.categoryItems()) {
      for (const item of cat.items) {
        if (keys.has(this.itemKey(item))) items.push(item);
      }
    }
    return items;
  });

  /** Materials and products that appear in at least one selected item (for Remove menu) */
  materialsAndProductsInSelected = computed(() => {
    const selected = this.selectedItems();
    const materials: { material: Material }[] = [];
    const seenMaterialIds = new Set<string>();
    const products: { product: Product; variant?: ProductVariant }[] = [];
    const seenProductKey = (p: Product, v?: ProductVariant) => `${p.id}-${v?.id ?? 'base'}`;
    const seenProducts = new Set<string>();
    for (const item of selected) {
      for (const bom of item.boms) {
        if (!seenMaterialIds.has(bom.material.id)) {
          seenMaterialIds.add(bom.material.id);
          materials.push({ material: bom.material });
        }
      }
      for (const bop of item.bops) {
        if (!bop.productSource) continue;
        const src = { product: bop.productSource as Product, variant: bop.variantSource as ProductVariant | undefined };
        const key = seenProductKey(src.product, src.variant);
        if (!seenProducts.has(key)) {
          seenProducts.add(key);
          products.push(src);
        }
      }
    }
    return { materials, products };
  });

  /** Materials not in every selected item (for Add: add to those that don't have) */
  materialsForGroupAdd = computed(() => {
    const materials = this.materialsService.materialsQuery.data() || [];
    const selected = this.selectedItems();
    return materials.filter((material) =>
      selected.some((item) => !item.boms.some((bom) => bom.material.id === material.id)),
    );
  });

  /** Products that can be added to at least one selected item */
  productsForGroupAdd = computed(() => {
    const all = this.allProducts();
    const selected = this.selectedItems();
    const bops = this.materialsService.bopsQuery.data() || [];
    return all.filter((item) =>
      selected.some((sel) => {
        if (sel.product?.id === item.product?.id && sel.variant?.id === item.variant?.id) return false;
        const alreadyHas = bops.some(
          (bop) =>
            bop.product?.id === sel.product?.id &&
            bop.variant?.id === sel.variant?.id &&
            bop.productSource?.id === item.product?.id &&
            bop.variantSource?.id === item.variant?.id,
        );
        return !alreadyHas;
      }),
    );
  });

  isItemSelected(item: CategoryItem['items'][number]): boolean {
    return this.selectedItemKeys().has(this.itemKey(item));
  }

  toggleItemSelection(item: CategoryItem['items'][number]): void {
    const set = new Set(this.selectedItemKeys());
    const key = this.itemKey(item);
    if (set.has(key)) set.delete(key);
    else set.add(key);
    this.selectedItemKeys.set(set);
  }

  isAllSelectedInCategory(categoryItem: CategoryItem): boolean {
    if (!categoryItem.items.length) return false;
    const keys = this.selectedItemKeys();
    return categoryItem.items.every((item) => keys.has(this.itemKey(item)));
  }

  selectedCountInCategory(categoryItem: CategoryItem): number {
    const keys = this.selectedItemKeys();
    return categoryItem.items.filter((item) => keys.has(this.itemKey(item))).length;
  }

  toggleSelectAllInCategory(categoryItem: CategoryItem): void {
    const set = new Set(this.selectedItemKeys());
    const allSelected = this.isAllSelectedInCategory(categoryItem);
    for (const item of categoryItem.items) {
      const key = this.itemKey(item);
      if (allSelected) set.delete(key);
      else set.add(key);
    }
    this.selectedItemKeys.set(set);
  }

  clearSelection(): void {
    this.selectedItemKeys.set(new Set());
  }

  /** Remove material from all selected items that have it */
  groupRemoveMaterial(material: Material): void {
    const selected = this.selectedItems();
    for (const item of selected) {
      const bom = item.boms.find((b) => b.material.id === material.id);
      if (bom) this.materialsService.deleteBomMutation.mutate(bom.id);
    }
  }

  /** Remove product from all selected items that have it */
  groupRemoveProduct(product: Product, variant?: ProductVariant): void {
    const selected = this.selectedItems();
    const bops = this.materialsService.bopsQuery.data() || [];
    for (const item of selected) {
      const bop = bops.find(
        (b) =>
          b.product?.id === item.product?.id &&
          b.variant?.id === item.variant?.id &&
          b.productSource?.id === product.id &&
          b.variantSource?.id === variant?.id,
      );
      if (bop) this.materialsService.deleteBopMutation.mutate(bop.id);
    }
  }

  /** Add material to all selected items that don't have it */
  groupAddMaterial(material: Material): void {
    const fields: PromptFields = {
      quantity: {
        label: this.translate.instant('materials.quantity'),
        type: 'number',
        eng: true,
        ltr: true,
        control: new FormControl(1, [Validators.required, Validators.min(0)]),
        hint: this.translate.instant('materials.units.' + material.unit),
      },
    };
    this.dialogService.prompt(material.name, fields).then((result) => {
      if (!result) return;
      const selected = this.selectedItems();
      const quantity = result.quantity as number;
      for (const item of selected) {
        if (!item.boms.some((b) => b.material.id === material.id)) {
          const bomDto = {
            product: { id: item.product.id } as Product,
            variant: item.variant ? ({ id: item.variant.id } as ProductVariant) : undefined,
            material, // full material so optimistic UI shows name
            quantity,
          } as BillOfMaterial;
          this.materialsService.saveBomMutation.mutate(bomDto);
        }
      }
    });
  }

  /** Add product to all selected items that don't have it */
  groupAddProduct(product: Product, variant?: ProductVariant): void {
    const fields: PromptFields = {
      quantity: {
        label: this.translate.instant('materials.quantity'),
        type: 'number',
        eng: true,
        ltr: true,
        control: new FormControl(1, [Validators.required, Validators.min(0)]),
      },
    };
    let title = product.title;
    if (variant) title += ` - ${variant.title}`;
    this.dialogService.prompt(title, fields).then((result) => {
      if (!result) return;
      const selected = this.selectedItems();
      const quantity = result.quantity as number;
      const bops = this.materialsService.bopsQuery.data() || [];
      for (const item of selected) {
        const has = bops.some(
          (bop) =>
            bop.product?.id === item.product?.id &&
            bop.variant?.id === item.variant?.id &&
            bop.productSource?.id === product.id &&
            bop.variantSource?.id === variant?.id,
        );
        if (!has) {
          const bopDto = {
            product: { id: item.product.id } as Product,
            variant: item.variant ? ({ id: item.variant.id } as ProductVariant) : undefined,
            productSource: product, // full product so optimistic UI shows title
            variantSource: variant, // full variant so optimistic UI shows title
            quantity,
          } as BillOfProduct;
          this.materialsService.saveBopMutation.mutate(bopDto);
        }
      }
    });
  }

  filteredMaterials = computed(() => {
    const materials = this.materialsService.materialsQuery.data() || [];
    const editableItem = this.editableItem();
    if (editableItem) {
      return materials.filter(
        (material) =>
          !editableItem.boms.some((bom) => bom.material.id === material.id) &&
          material.name.toLowerCase().includes(this.searchMaterialInput().toLowerCase()),
      );
    }
    return [];
  });

  filteredProducts = computed(() => {
    const allProducts = this.allProducts();
    const editableItem = this.editableItem();
    if (editableItem) {
      return allProducts.filter((item) => {
        const bops = this.materialsService.bopsQuery.data() || [];
        if (
          bops.some(
            (bop) =>
              bop.product?.id === item.product?.id &&
              bop.variant?.id === item.variant?.id &&
              bop.productSource?.id === editableItem.product?.id &&
              bop.variantSource?.id === editableItem.variant?.id,
          )
        )
          return false;

        if (editableItem.product?.id === item.product?.id && editableItem.variant?.id === item.variant?.id)
          return false;

        if (
          editableItem.bops.some(
            (bop) => bop.productSource?.id === item.product?.id && bop.variantSource?.id === item.variant?.id,
          )
        )
          return false;

        return item.product.title.toLowerCase().includes(this.searchMaterialInput().toLowerCase());
      });
    }
    return [];
  });

  editableItem = signal<CategoryItem['items'][number] | null>(null);
  editType = signal<'material' | 'product'>('material');

  categoryItems = computed<CategoryItem[]>(() => {
    const result: CategoryItem[] = [];
    const allBoms = this.materialsService.bomsQuery.data() || [];
    const allBops = this.materialsService.bopsQuery.data() || [];
    const showInactiveItems = this.showInactiveItems();
    const selectedCategory = this.selectedCategory();
    const categories = this.menuService.data()?.categories || [];
    for (const category of categories) {
      if (selectedCategory && selectedCategory !== category.id) continue;
      const items: {
        product: Product;
        variant?: ProductVariant;
        boms: BillOfMaterial[];
        bops: BillOfProduct[];
        cost?: number | null;
      }[] = [];
      for (const product of category.products || []) {
        if (!product.variants?.length) {
          if (!showInactiveItems && product.status === Status.Inactive) continue;
          const productBoms = allBoms.filter((bom) => bom.product?.id === product.id);
          const productBops = allBops.filter((bop) => bop.product?.id === product.id);
          if (this.searchQuery() && !product.title.toLowerCase().includes(this.searchQuery().toLowerCase()))
            continue;

          items.push({
            product,
            boms: productBoms.filter((bom) => !bom.variant),
            bops: productBops.filter((bop) => !bop.variant),
            cost: product.variants?.length ? null : Product.calculateCost(product, null, allBoms, allBops),
          });
        } else {
          const variants = product.variants || [];
          for (const variant of variants) {
            if (!showInactiveItems && variant.status === Status.Inactive) continue;
            const variantBoms = allBoms.filter((bom) => bom.variant?.id === variant.id);
            const variantBops = allBops.filter((bop) => bop.variant?.id === variant.id);
            if (
              this.searchQuery() &&
              !variant.title.toLowerCase().includes(this.searchQuery().toLowerCase()) &&
              !product.title.toLowerCase().includes(this.searchQuery().toLowerCase())
            )
              continue;
            items.push({
              product,
              variant,
              boms: variantBoms,
              bops: variantBops,
              cost: Product.calculateCost(product, variant, allBoms, allBops),
            });
          }
        }
      }
      if (items.length) result.push({ category, items });
    }
    return result;
  });

  addBom(product: Product, variant?: ProductVariant, material?: Material) {
    const fields: PromptFields = {
      material: {
        label: this.translate.instant('materials.title'),
        type: 'select',
        options: this.materialsService.materialsQuery.data()?.map((material) => ({
          value: { id: material.id },
          text: `${material.name} (${this.translate.instant('materials.units.' + material.unit)})`,
        })),
        control: new FormControl(undefined, Validators.required),
      },
      quantity: {
        label: this.translate.instant('materials.quantity'),
        type: 'number',
        eng: true,
        ltr: true,
        control: new FormControl(1, [Validators.required, Validators.min(0)]),
      },
    };

    if (material) {
      delete fields['material'];
    }
    this.dialogService
      .prompt(material ? material.name : this.translate.instant('materials.add'), fields)
      .then((result) => {
        if (!result) return;
        const bomDto = {
          product: product ? ({ id: product.id } as Product) : undefined,
          variant: variant ? ({ id: variant.id } as ProductVariant) : undefined,
          material: material ?? result.material,
          quantity: result.quantity,
        } as BillOfMaterial;
        this.materialsService.saveBomMutation.mutate(bomDto);
      });
  }

  editBom(bom: BillOfMaterial): void {
    const fields: PromptFields = {
      quantity: {
        label: this.translate.instant('materials.quantity'),
        type: 'number',
        eng: true,
        ltr: true,
        control: new FormControl(bom.quantity, [Validators.required, Validators.min(0)]),
        hint: this.translate.instant('materials.units.' + bom.material.unit),
      },
    };
    this.dialogService.prompt(this.translate.instant(bom.material.name), fields).then((result) => {
      if (!result) return;
      this.materialsService.saveBomMutation.mutate({
        id: bom.id,
        quantity: result.quantity,
      });
    });
  }

  removeBom(bom: BillOfMaterial): void {
    this.materialsService.deleteBomMutation.mutate(bom.id);
  }

  addBop(
    product: Product,
    variant: ProductVariant | undefined,
    sourceProduct: Product,
    sourceVariant?: ProductVariant,
  ) {
    const fields: PromptFields = {
      quantity: {
        label: this.translate.instant('materials.quantity'),
        type: 'number',
        eng: true,
        ltr: true,
        control: new FormControl(1, [Validators.required, Validators.min(0)]),
      },
    };

    let title = sourceProduct.title;
    if (sourceVariant) {
      title += ` - ${sourceVariant.title}`;
    }

    this.dialogService.prompt(title, fields).then((result) => {
      if (!result) return;
      const bopDto = {
        product: product ? ({ id: product.id } as Product) : undefined,
        variant: variant ? ({ id: variant.id } as ProductVariant) : undefined,
        productSource: { id: sourceProduct.id },
        variantSource: sourceVariant ? { id: sourceVariant.id } : undefined,
        quantity: result.quantity,
      } as BillOfProduct;
      this.materialsService.saveBopMutation.mutate(bopDto);
    });
  }

  editBop(bop: BillOfProduct): void {
    let title = bop.product?.title || '';
    if (bop.variant) {
      title += ` - ${bop.variant.title}`;
    }
    const fields: PromptFields = {
      quantity: {
        label: this.translate.instant('materials.quantity'),
        type: 'number',
        eng: true,
        ltr: true,
        control: new FormControl(bop.quantity, [Validators.required, Validators.min(0)]),
      },
    };
    this.dialogService.prompt(this.translate.instant(title), fields).then((result) => {
      if (!result) return;
      this.materialsService.saveBopMutation.mutate({
        id: bop.id,
        quantity: result.quantity,
      });
    });
  }

  removeBop(bop: BillOfProduct): void {
    this.materialsService.deleteBopMutation.mutate(bop.id);
  }

  setEditableItem(item: CategoryItem['items'][number], type: 'product' | 'material'): void {
    this.searchMaterialInput.set('');
    this.editableItem.set(item);
    this.editType.set(type);
    setTimeout(() => {
      document.querySelector<HTMLInputElement>('.search-material-input')?.focus();
    }, 300);
  }

  selectMaterial(value: { material: Material; product: Product; variant?: ProductVariant }): void {
    const item = this.editableItem();
    if (item) {
      this.editableItem.set(null);
      this.searchMaterialInput.set('');
      if (value.material) {
        this.addBom(item.product, item.variant, value.material);
      } else {
        this.addBop(item.product, item.variant, value.product, value.variant);
      }
    }
  }
}
