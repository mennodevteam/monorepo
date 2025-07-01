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
import { MatSortModule, Sort } from '@angular/material/sort';

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
  profitPercentage: number;
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
    MatSortModule,
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
    'profitPercentage',
  ];
  menuService = inject(MenuService);
  materialsService = inject(MaterialsService);
  dialogService = inject(DialogService);
  translate = inject(TranslateService);
  public shopService = inject(ShopService);
  public sort = signal<Sort | null>(null);

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

      const products = category.products || [];

      for (const product of products) {
        if (!product.variants?.length) {
          if (this.searchQuery() && !product.title.toLowerCase().includes(this.searchQuery().toLowerCase()))
            continue;

          const productBoms = this.boms().filter((bom) => bom.product?.id === product.id);
          const materialCost = product.variants ? 0 : this.calculateCost(productBoms);
          result.push({
            category,
            product,
            boms: productBoms.filter((bom) => !!bom.variant),
            materialCost,
            costs: product.costs?.filter((cost) => (cost.fixedCost || cost.percentageCost) > 0) || [],
            discounts: product.costs?.filter((cost) => (cost.fixedCost || cost.percentageCost) < 0) || [],
            total: Product.totalPrice(product),
            profit: materialCost ? product.price - materialCost : 0,
            profitPercentage:
              product.price && materialCost ? ((product.price - materialCost) / product.price) * 100 : 0,
          });
        } else {
          const variants = product.variants || [];
          for (const variant of variants) {
            if (
              this.searchQuery() &&
              !variant.title.toLowerCase().includes(this.searchQuery().toLowerCase()) &&
              !product.title.toLowerCase().includes(this.searchQuery().toLowerCase())
            )
              continue;

            const variantBoms = this.boms().filter((bom) => bom.variant?.id === variant.id);
            const materialCost = this.calculateCost(variantBoms);
            result.push({
              category,
              product,
              variant,
              boms: variantBoms,
              materialCost,
              costs: product.costs?.filter((cost) => (cost.fixedCost || cost.percentageCost) > 0) || [],
              discounts: product.costs?.filter((cost) => (cost.fixedCost || cost.percentageCost) < 0) || [],
              total: Product.totalPrice(product, variant),
              profit: materialCost ? variant.price - materialCost : 0,
              profitPercentage:
                variant.price && materialCost ? ((variant.price - materialCost) / variant.price) * 100 : 0,
            });
          }
        }
      }
    }

    const sort = this.sort();
    if (sort) {
      result.sort((a, b) => {
        let comparison = 0;
        switch (sort.active) {
          case 'title': {
            comparison = a.product.title.localeCompare(b.product.title);
            break;
          }
          case 'basePrice': {
            const aPrice = a.variant ? a.variant.price : a.product.price;
            const bPrice = b.variant ? b.variant.price : b.product.price;
            comparison = aPrice - bPrice;
            break;
          }
          case 'total': {
            comparison = a.total - b.total;
            break;
          }
          case 'materialCost': {
            comparison = (a.materialCost || 0) - (b.materialCost || 0);
            break;
          }
          case 'profit': {
            comparison = (a.profit || 0) - (b.profit || 0);
            break;
          }
          case 'profitPercentage': {
            comparison = (a.profitPercentage || 0) - (b.profitPercentage || 0);
            break;
          }
          default: {
            comparison = a.product.title.localeCompare(b.product.title);
            break;
          }
        }

        return sort.direction === 'desc' ? -comparison : comparison;
      });
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

  onMatSortChange(sort: Sort) {
    this.sort.set(sort);
  }
}
