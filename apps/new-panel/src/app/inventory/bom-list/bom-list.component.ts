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
  displayedColumns: string[] = ['title', 'materials', 'cost'];
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
      return allProducts.filter((item) =>
        // !editableItem.bops.some(
        //   (bop) => bop.product?.id === item.product?.id && bop.variant?.id === item.variant?.id,
        // ) &&
        item.product.title.toLowerCase().includes(this.searchMaterialInput().toLowerCase()),
      );
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
