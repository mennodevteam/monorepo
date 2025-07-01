import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatSelectModule } from '@angular/material/select';
import { FormControl, FormsModule, Validators } from '@angular/forms';
import { MaterialsService } from '../inventory/materials.service';
import { Product, ProductVariant, Material, BillOfMaterial, ProductCategory, MenuCost } from '@menno/types';
import { MenuService } from '../menu/menu.service';
import { SHARED } from '../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { PromptFields } from '../shared/dialogs/prompt-dialog/prompt-dialog.component';
import { DialogService } from '../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatInputModule } from '@angular/material/input';
import { ShopService } from '../shop/shop.service';

interface CategoryItem {
  category: ProductCategory;
  items: {
    product: Product;
    variant?: ProductVariant;
    boms: BillOfMaterial[];
    costs: MenuCost[];
    discounts: MenuCost[];
    total: number;
    materialCost: number;
    profit: number;
  }[];
}

interface PricingItem {
  category: ProductCategory;
  product: Product;
  variant?: ProductVariant;
  boms: BillOfMaterial[];
  costs: MenuCost[];
  discounts: MenuCost[];
  total: number;
  materialCost: number;
  profit: number;
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
    MatSelectModule,
    FormsModule,
    SHARED,
    MatToolbarModule,
    MatCardModule,
    MatMenuModule,
    MatInputModule,
  ],
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.scss',
})
export class PricingComponent {
  displayedColumns: string[] = [
    'category',
    'title',
    'basePrice',
    'costs',
    'discounts',
    'total',
    'materialCost',
    'profit',
  ];
  menuService = inject(MenuService);
  materialsService = inject(MaterialsService);
  dialogService = inject(DialogService);
  translate = inject(TranslateService);
  public shopService = inject(ShopService);

  materials = computed<Material[]>(() => this.materialsService.materialsQuery.data() || []);

  searchQuery = signal('');
  selectedCategory = signal<ProductCategory | null>(null);

  categories = computed<ProductCategory[]>(() => {
    return this.menuService.data()?.categories || [];
  });

  boms = computed<BillOfMaterial[]>(() => {
    const booms: BillOfMaterial[] = [];
    for (const material of this.materials()) {
      for (const bom of material.boms) {
        booms.push({ ...bom, material });
      }
    }
    return booms;
  });

  pricingItems = computed<PricingItem[]>(() => {
    const result: PricingItem[] = [];
    const categories = this.menuService.data()?.categories || [];
    const selectedCategory = this.selectedCategory();
    
    for (const category of categories) {
      // Skip if category filter is applied and doesn't match
      if (selectedCategory && category.id !== selectedCategory.id) {
        continue;
      }
      
      const products =
        category.products?.filter((product) =>
          product.title.toLowerCase().includes(this.searchQuery().toLowerCase()),
        ) || [];
        
      for (const product of products) {
        if (!product.variants?.length) {
          const productBoms = this.boms().filter((bom) => bom.product?.id === product.id);
          result.push({
            category,
            product,
            boms: productBoms.filter((bom) => !!bom.variant),
            materialCost: product.variants ? 0 : this.calculateCost(productBoms),
            costs: product.costs?.filter((cost) => (cost.fixedCost || cost.percentageCost) > 0) || [],
            discounts: product.costs?.filter((cost) => (cost.fixedCost || cost.percentageCost) < 0) || [],
            total: Product.totalPrice(product),
            profit: product.price - this.calculateCost(productBoms),
          });
        } else {
          const variants =
            product.variants?.filter((variant) =>
              variant.title.toLowerCase().includes(this.searchQuery().toLowerCase()),
            ) || [];
          for (const variant of variants) {
            const variantBoms = this.boms().filter((bom) => bom.variant?.id === variant.id);
            result.push({
              category,
              product,
              variant,
              boms: variantBoms,
              materialCost: this.calculateCost(variantBoms),
              costs: product.costs?.filter((cost) => (cost.fixedCost || cost.percentageCost) > 0) || [],
              discounts: product.costs?.filter((cost) => (cost.fixedCost || cost.percentageCost) < 0) || [],
              total: Product.totalPrice(product, variant),
              profit: variant.price - this.calculateCost(variantBoms),
            });
          }
        }
      }
    }
    return result;
  });

  calculateCost(boms: BillOfMaterial[]): number {
    if (boms.length === 0 || boms.some((bom) => bom.material.cost == null)) return 0;
    return boms.reduce((acc, bom) => acc + bom.quantity * (bom.material.cost || 0), 0);
  }

  editPrice(item: { product: Product; variant?: ProductVariant }): void {
    if (item.variant) {
      this.changeProductVariantPrice(item.product, item.variant);
    } else {
      this.changeProductPrice(item.product);
    }
  }

  changeProductPrice(product: Product) {
    const fields: PromptFields = {
      price: {
        label: this.translate.instant('app.price'),
        control: new FormControl(product.price, Validators.required),
        hint: this.translate.instant('app.currency'),
        ltr: true,
        eng: true,
        type: 'number',
      },
    };
    this.dialogService.prompt(product.title, fields).then((dto) => {
      if (dto) {
        this.menuService.saveProductMutation.mutate({ id: product.id, price: Number(dto.price) });
      }
    });
  }

  changeProductVariantPrice(product: Product, variant: ProductVariant) {
    const fields: PromptFields = {
      price: {
        label: this.translate.instant('app.price'),
        control: new FormControl(variant.price, Validators.required),
        hint: this.translate.instant('app.currency'),
        ltr: true,
        eng: true,
        type: 'number',
      },
    };
    this.dialogService.prompt(`${product.title} ${variant.title}`, fields).then((dto) => {
      if (dto) {
        const variants = product.variants.map((item) =>
          item.id === variant.id
            ? ({ id: item.id, price: Number(dto.price) } as ProductVariant)
            : ({ id: item.id } as ProductVariant),
        );
        this.menuService.saveProductMutation.mutate({ id: product.id, variants });
      }
    });
  }
}
