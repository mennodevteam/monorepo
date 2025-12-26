import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Menu, Product, ProductVariant, ProductCategory, Status, BillOfMaterial, BillOfProduct } from '@menno/types';
import { SHARED } from '../../shared';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { StatusChipComponent } from '../../shared/components/status-chip/status-chip.component';
import { MenuService } from '../menu.service';
import { MaterialsService } from '../../inventory/materials.service';
import { HttpClient } from '@angular/common/http';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { lastValueFrom } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSortModule, Sort } from '@angular/material/sort';
import { ShopService } from '../../shop/shop.service';

interface AvailabilityItem {
  category: ProductCategory;
  product: Product;
  variant?: ProductVariant;
  availability: number | null;
  orderCount: number;
}

interface MaterialAvailability {
  materialName: string;
  quantity: number;
  estimation: number | null;
  unit: string;
  stock: number;
}

@Component({
  selector: 'app-product-availability',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    MatTableModule,
    MatChipsModule,
    StatusChipComponent,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatToolbarModule,
    MatCardModule,
    MatCheckboxModule,
    MatMenuModule,
    MatDividerModule,
    MatSortModule,
  ],
  templateUrl: './product-availability.component.html',
  styleUrl: './product-availability.component.scss',
})
export class ProductAvailabilityComponent {
  menu = inject(MenuService);
  materialsService = inject(MaterialsService);
  shopService = inject(ShopService);
  http = inject(HttpClient);
  readonly displayedColumns = ['category', 'title', 'availability', 'orderCount', 'status'];
  Status = Status;

  // Query for product order counts
  productOrderCountsQuery = injectQuery(() => ({
    queryKey: ['productOrderCounts'],
    queryFn: () => lastValueFrom(this.http.get<Record<string, number>>('/orders/product-order-counts')),
  }));

  // Filters
  searchQuery = signal<string>('');
  selectedCategory = signal<ProductCategory | null>(null);
  showInactiveItems = signal(false);
  maxAvailability = signal<number | null>(null);
  minOrder = signal<number | null>(null);
  public sort = signal<Sort | null>(null);

  categories = computed<ProductCategory[]>(() => {
    return this.menu.data()?.categories || [];
  });

  materials = computed(() => {
    return this.materialsService.materialsQuery.data() || [];
  });

  boms = computed<BillOfMaterial[]>(() => {
    const booms: BillOfMaterial[] = [];
    for (const material of this.materials()) {
      for (const bom of material.boms || []) {
        booms.push({ ...bom, material });
      }
    }
    return booms;
  });

  bops = computed<BillOfProduct[]>(() => {
    return this.materialsService.bopsQuery.data() || [];
  });

  /**
   * Calculate product availability based on BOM (Bill of Materials) and materials inventory.
   * 
   * Algorithm:
   * 1. For each material required (BOM):
   *    - Get the material's current stock from inventory
   *    - Divide stock by quantity needed per product: stock / bom.quantity
   *    - This gives how many products can be made from this material
   * 
   * 2. For each product required (BOP - Bill of Products):
   *    - Recursively calculate availability of the source product
   *    - Divide source availability by quantity needed: sourceAvailability / bop.quantity
   *    - This gives how many products can be made from the source product
   * 
   * 3. Take the minimum of all calculated counts (the limiting factor)
   *    - Example: If Material A allows 10 products and Material B allows 5 products,
   *      only 5 products can be made (limited by Material B)
   * 
   * 4. If no BOM/BOP is defined, return null (unlimited availability)
   * 
   * 5. Prevents infinite recursion with visited set for circular dependencies
   * 
   * Example:
   * - Product needs: 2kg flour (stock: 20kg) and 1kg sugar (stock: 5kg)
   * - Flour allows: 20 / 2 = 10 products
   * - Sugar allows: 5 / 1 = 5 products
   * - Result: min(10, 5) = 5 products available
   */
  calculateAvailability(
    product: Product,
    variant?: ProductVariant,
    visited: Set<string> = new Set(),
  ): number | null {
    // Create a unique key for this product/variant combination
    const key = `${product.id}-${variant?.id || 'none'}`;
    
    // Prevent infinite recursion in case of circular dependencies
    if (visited.has(key)) {
      return null; // Circular dependency, return null (unlimited)
    }
    visited.add(key);

    const allBoms = this.boms();
    const allBops = this.bops();
    const materials = this.materials();

    // Get BOMs for this product/variant
    const productBoms = allBoms.filter(
      (bom) => bom.product?.id === product.id && bom.variant?.id === variant?.id,
    );

    // Get BOPs for this product/variant
    const productBops = allBops.filter(
      (bop) => bop.product?.id === product.id && bop.variant?.id === variant?.id,
    );

    // If no BOMs or BOPs, return null (unlimited)
    if (productBoms.length === 0 && productBops.length === 0) {
      visited.delete(key);
      return null;
    }

    const availabilityCounts: number[] = [];

    // Calculate availability from BOMs (materials)
    // For each material: stock / quantity_needed = products_available
    for (const bom of productBoms) {
      if (!bom.material || bom.quantity === 0) continue;
      
      const material = materials.find((m) => m.id === bom.material.id);
      if (!material) continue;

      // Calculate how many products can be made from this material
      const count = Math.floor(material.stock / bom.quantity);
      availabilityCounts.push(count);
    }

    // Calculate availability from BOPs (products made from other products)
    // Recursively calculate source product availability, then divide by quantity needed
    for (const bop of productBops) {
      if (!bop.productSource) continue;
      
      // Recursively calculate availability of source product
      const sourceAvailability = this.calculateAvailability(
        bop.productSource,
        bop.variantSource,
        visited,
      );
      if (sourceAvailability === null) {
        // If source is unlimited, this product is also unlimited
        visited.delete(key);
        return null;
      }
      // Calculate how many can be made from source product
      const count = Math.floor(sourceAvailability / bop.quantity);
      availabilityCounts.push(count);
    }

    visited.delete(key);
    
    // Return the minimum (the limiting factor)
    // The product can only be made as many times as the most limiting material/product allows
    if (availabilityCounts.length === 0) return null;
    return Math.min(...availabilityCounts);
  }

  // Get order count for a product/variant
  getOrderCount(product: Product, variant?: ProductVariant): number {
    const counts = this.productOrderCountsQuery.data();
    if (!counts) return 0;

    const key = variant?.id ? `${product.id}-${variant.id}` : `${product.id}-null`;
    return counts[key] || 0;
  }

  availabilityItems = computed<AvailabilityItem[]>(() => {
    const result: AvailabilityItem[] = [];
    const categories = this.menu.data()?.categories || [];
    const selectedCategory = this.selectedCategory();
    const showInactiveItems = this.showInactiveItems();
    const searchQuery = this.searchQuery().toLowerCase().trim();
    const maxAvailability = this.maxAvailability();
    const minOrder = this.minOrder();

    for (const category of categories) {
      // Skip if category filter is applied and doesn't match
      if (selectedCategory && category.id !== selectedCategory.id) {
        continue;
      }

      const products = category.products || [];

      for (const product of products) {
        if (!product.variants?.length) {
          if (!showInactiveItems && product.status === Status.Inactive) continue;
          if (searchQuery && !product.title.toLowerCase().includes(searchQuery)) continue;

          const availability = this.calculateAvailability(product);
          
          // Apply max availability filter
          if (maxAvailability !== null && availability !== null && availability > maxAvailability) continue;

          const orderCount = this.getOrderCount(product);
          
          // Apply min order filter
          if (minOrder !== null && orderCount < minOrder) continue;

          result.push({
            category,
            product,
            availability,
            orderCount,
          });
        } else {
          const variants = product.variants || [];
          for (const variant of variants) {
            if (!showInactiveItems && variant.status === Status.Inactive) continue;
            if (
              searchQuery &&
              !variant.title.toLowerCase().includes(searchQuery) &&
              !product.title.toLowerCase().includes(searchQuery)
            )
              continue;

            const availability = this.calculateAvailability(product, variant);
            
            // Apply max availability filter
            if (maxAvailability !== null && availability !== null && availability > maxAvailability) continue;

            const orderCount = this.getOrderCount(product, variant);
            
            // Apply min order filter
            if (minOrder !== null && orderCount < minOrder) continue;

            result.push({
              category,
              product,
              variant,
              availability,
              orderCount,
            });
          }
        }
      }
    }

    // Apply sorting
    const sort = this.sort();
    if (sort) {
      result.sort((a, b) => {
        let comparison = 0;
        switch (sort.active) {
          case 'title': {
            const aTitle = a.variant ? `${a.product.title} ${a.variant.title}` : a.product.title;
            const bTitle = b.variant ? `${b.product.title} ${b.variant.title}` : b.product.title;
            comparison = aTitle.localeCompare(bTitle);
            break;
          }
          case 'category': {
            comparison = a.category.title.localeCompare(b.category.title);
            break;
          }
          case 'availability': {
            // Sort null (unlimited) last, then by value
            if (a.availability === null && b.availability === null) {
              comparison = 0;
            } else if (a.availability === null) {
              comparison = 1; // null goes last
            } else if (b.availability === null) {
              comparison = -1; // null goes last
            } else {
              comparison = a.availability - b.availability;
            }
            break;
          }
          case 'orderCount': {
            comparison = a.orderCount - b.orderCount;
            break;
          }
          default: {
            const aTitle = a.variant ? `${a.product.title} ${a.variant.title}` : a.product.title;
            const bTitle = b.variant ? `${b.product.title} ${b.variant.title}` : b.product.title;
            comparison = aTitle.localeCompare(bTitle);
            break;
          }
        }

        return sort.direction === 'desc' ? -comparison : comparison;
      });
    }

    return result;
  });

  /**
   * Get material availability details for a product/variant
   * Returns array of materials with their names, quantities needed, and estimations
   */
  getMaterialAvailabilityDetails(
    product: Product,
    variant?: ProductVariant,
  ): MaterialAvailability[] {
    const allBoms = this.boms();
    const materials = this.materials();
    const result: MaterialAvailability[] = [];

    // Get BOMs for this product/variant
    const productBoms = allBoms.filter(
      (bom) => bom.product?.id === product.id && bom.variant?.id === variant?.id,
    );

    for (const bom of productBoms) {
      if (!bom.material || bom.quantity === 0) continue;

      const material = materials.find((m) => m.id === bom.material.id);
      if (!material) continue;

      // Calculate estimation: how many products can be made from this material
      const estimation = Math.floor(material.stock / bom.quantity);

      result.push({
        materialName: material.name,
        quantity: bom.quantity,
        estimation: material.stock > 0 ? estimation : 0,
        unit: material.unit,
        stock: material.stock,
      });
    }

    return result;
  }

  changeProductStatus(product: Product, status: Status) {
    this.menu.saveProductMutation.mutate({ id: product.id, status });
  }

  changeProductVariantStatus(product: Product, variant: ProductVariant, status: Status) {
    const variants = product.variants.map((item) =>
      item.id === variant.id
        ? ({ id: item.id, status } as ProductVariant)
        : ({ id: item.id } as ProductVariant),
    );
    this.menu.saveProductMutation.mutate({ id: product.id, variants });
  }

  setMaxAvailability(value: string | number | null) {
    if (value === null || value === '' || value === undefined) {
      this.maxAvailability.set(null);
    } else {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      this.maxAvailability.set(isNaN(num) ? null : num);
    }
  }

  setMinOrder(value: string | number | null) {
    if (value === null || value === '' || value === undefined) {
      this.minOrder.set(null);
    } else {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      this.minOrder.set(isNaN(num) ? null : num);
    }
  }

  clearFilters() {
    this.searchQuery.set('');
    this.selectedCategory.set(null);
    this.maxAvailability.set(null);
    this.minOrder.set(null);
  }

  onMatSortChange(sort: Sort) {
    this.sort.set(sort);
  }
}
