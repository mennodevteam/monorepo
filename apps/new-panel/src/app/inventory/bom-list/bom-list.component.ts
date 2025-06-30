import { Component, computed, inject, signal } from '@angular/core';
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

interface CategoryItem {
  category: ProductCategory;
  items: { product?: Product; variant?: ProductVariant; boms: BillOfMaterial[] }[];
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
  ],
  templateUrl: './bom-list.component.html',
  styleUrl: './bom-list.component.scss',
})
export class BomListComponent {
  displayedColumns: string[] = ['title', 'materials'];
  menuService = inject(MenuService);
  materialsService = inject(MaterialsService);
  dialogService = inject(DialogService);
  translate = inject(TranslateService);

  materials = computed<Material[]>(() => this.materialsService.materialsQuery.data() || []);

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
    const categories = this.menuService.data()?.categories || [];
    for (const category of categories) {
      const items: { product?: Product; variant?: ProductVariant; boms: BillOfMaterial[] }[] = [];
      for (const product of category.products || []) {
        items.push({
          product,
          boms: this.boms().filter((bom) => bom.product?.id === product.id && !!bom.variant),
        });
        for (const variant of product.variants || []) {
          items.push({
            variant,
            boms: this.boms().filter((bom) => bom.variant?.id === variant.id),
          });
        }
      }
      result.push({ category, items });
    }
    return result;
  });

  addBom(product: Product, variant?: ProductVariant): void {
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
    this.dialogService.prompt(this.translate.instant('materials.add'), fields).then((result) => {
      this.materialsService.saveBomMutation.mutate({
        product: product ? ({ id: product.id } as Product) : undefined,
        variant: variant ? ({ id: variant.id } as ProductVariant) : undefined,
        material: result.material,
        quantity: result.quantity,
      });
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
      this.materialsService.saveBomMutation.mutate({
        id: bom.id,
        quantity: result.quantity,
      });
    });
  }

  removeBom(bom: BillOfMaterial): void {
    this.materialsService.deleteBomMutation.mutate(bom.id);
  }
}
