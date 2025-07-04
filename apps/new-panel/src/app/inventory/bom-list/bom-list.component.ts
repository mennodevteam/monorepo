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
import { Product, ProductVariant, Material, BillOfMaterial, ProductCategory } from '@menno/types';
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

interface CategoryItem {
  category: ProductCategory;
  items: { product: Product; variant?: ProductVariant; boms: BillOfMaterial[]; cost?: number | null }[];
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

  materials = computed<Material[]>(() => this.materialsService.materialsQuery.data() || []);

  searchQuery = signal('');
  searchMaterialInput = signal<string>('');
  filteredMaterials = computed(() => {
    const editableItem = this.editableItem();
    if (editableItem) {
      const materials = this.materials().filter(
        (material) =>
          !editableItem.boms.some((bom) => bom.material.id === material.id) &&
          material.name.toLowerCase().includes(this.searchMaterialInput().toLowerCase()),
      );
      return materials;
    }
    return [];
  });
  editableItem = signal<CategoryItem['items'][number] | null>(null);

  boms = computed<BillOfMaterial[]>(() => {
    const booms: BillOfMaterial[] = [];
    for (const material of this.materials()) {
      for (const bom of material.boms) {
        booms.push({ ...bom, material });
      }
    }
    return booms;
  });

  categoryItems = computed<CategoryItem[]>(() => {
    const result: CategoryItem[] = [];
    const boms = this.boms();
    const categories = this.menuService.data()?.categories || [];
    for (const category of categories) {
      const items: {
        product: Product;
        variant?: ProductVariant;
        boms: BillOfMaterial[];
        cost?: number | null;
      }[] = [];
      for (const product of category.products || []) {
        if (!product.variants?.length) {
          const productBoms = boms.filter((bom) => bom.product?.id === product.id);
          if (this.searchQuery() && !product.title.toLowerCase().includes(this.searchQuery().toLowerCase()))
            continue;

          items.push({
            product,
            boms: productBoms.filter((bom) => !bom.variant),
            cost: product.variants?.length ? null : this.calculateCost(productBoms),
          });
        } else {
          const variants = product.variants || [];
          for (const variant of variants) {
            const variantBoms = boms.filter((bom) => bom.variant?.id === variant.id);
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
              cost: this.calculateCost(variantBoms),
            });
          }
        }
      }
      if (items.length) result.push({ category, items });
    }
    return result;
  });

  calculateCost(boms: BillOfMaterial[]): number | null {
    if (boms.length === 0) return null;
    return boms.reduce((acc, bom) => acc + bom.quantity * (bom.material.cost || 0), 0);
  }

  addBom(product: Product, variant?: ProductVariant, material?: Material) {
    const fields: PromptFields = {
      material: {
        label: this.translate.instant('materials.title'),
        type: 'select',
        options: this.materials().map((material) => ({
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

  setEditableItem(item: CategoryItem['items'][number]): void {
    this.searchMaterialInput.set('');
    this.editableItem.set(item);
    setTimeout(() => {
      document.querySelector<HTMLInputElement>('.search-material-input')?.focus();
    }, 300);
  }

  selectMaterial(materialId: string): void {
    const item = this.editableItem();
    if (item) {
      this.editableItem.set(null);
      this.searchMaterialInput.set('');
      this.addBom(
        item.product,
        item.variant,
        this.materials().find((material) => material.id === materialId),
      );
    }
  }
}
