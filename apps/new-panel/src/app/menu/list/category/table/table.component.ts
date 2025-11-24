import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuCost, Product, ProductCategory, ProductVariant, Status } from '@menno/types';
import { SHARED } from '../../../../shared';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { StatusChipComponent } from '../../../../shared/components/status-chip/status-chip.component';
import { MenuService } from '../../../menu.service';
import { PromptFields } from '../../../../shared/dialogs/prompt-dialog/prompt-dialog.component';
import { FormControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { DialogService } from '../../../../core/services/dialog.service';
import { MatSnackBar } from '@angular/material/snack-bar';
const COLS = ['index', 'image', 'title', 'price', 'costs', 'status', 'actions'];
@Component({
  selector: 'app-product-table',
  standalone: true,
  imports: [CommonModule, SHARED, MatTableModule, MatChipsModule, StatusChipComponent],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
})
export class ProductTableComponent {
  category = input<ProductCategory>();
  menu = inject(MenuService);
  dialog = inject(DialogService);
  t = inject(TranslateService);
  snack = inject(MatSnackBar);
  readonly displayedColumns = COLS;
  Status = Status;

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

  changeProductPrice(product: Product) {
    const fields: PromptFields = {
      price: {
        label: this.t.instant('app.price'),
        control: new FormControl(product.price, Validators.required),
        hint: this.t.instant('app.currency'),
        ltr: true,
      },
    };
    this.dialog.prompt(product.title, fields).then((dto) => {
      if (dto) {
        this.menu.saveProductMutation.mutate({ id: product.id, price: dto.price });
      }
    });
  }

  changeProductVariantPrice(product: Product, variant: ProductVariant) {
    const fields: PromptFields = {
      title: {
        label: this.t.instant('app.title'),
        control: new FormControl(variant.title, Validators.required),
      },
      price: {
        label: this.t.instant('app.price'),
        control: new FormControl(variant.price, Validators.required),
        hint: this.t.instant('app.currency'),
        ltr: true,
      },
    };
    this.dialog.prompt(`${product.title} ${variant.title}`, fields).then((dto) => {
      if (dto) {
        const variants = product.variants.map((item) =>
          item.id === variant.id
            ? ({ id: item.id, ...dto } as ProductVariant)
            : ({ id: item.id } as ProductVariant),
        );
        this.menu.saveProductMutation.mutate({ id: product.id, variants });
      }
    });
  }

  editCost(cost: MenuCost) {
    //
  }

  duplicateProduct(product: Product) {
    const categories = this.menu.categories();
    if (!categories?.length) return;

    this.dialog
      .prompt(this.t.instant('menu.duplicate.title'), {
        category: {
          label: this.t.instant('menu.duplicate.categoryLabel'),
          control: new FormControl(this.category()?.id, Validators.required),
          type: 'select',
          options: categories.map((c) => ({ text: c.title, value: c.id })),
        },
      })
      .then(async (res) => {
        if (res) {
          const categoryId = res.category;
          const category = { id: categoryId } as ProductCategory;
          if (category) {
            const newProduct: Product = {
              ...product,
              id: undefined as any,
              category,
              variants:
                product.variants?.map(
                  (v) =>
                    ({
                      title: v.title,
                      price: v.price,
                      status: v.status,
                      position: v.position,
                    }) as ProductVariant,
                ) || [],
              imageFiles: product.imageFiles, // Keep same image references
              createdAt: undefined,
              updatedAt: undefined,
              deletedAt: undefined,
              costs: undefined,
            };
            this.snack.open(this.t.instant('app.saving'), '', { duration: 5000 });
            await this.menu.saveProductMutation.mutateAsync(newProduct);
            this.snack.open(this.t.instant('app.savedSuccessfully'), '', { duration: 2000 });
          }
        }
      });
  }
}
