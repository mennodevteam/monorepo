import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product, ProductCategory, ProductVariant, Status } from '@menno/types';
import { SHARED } from '../../../../shared';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MenuStatusChipComponent } from '../../../status-chip/status-chip.component';
import { MenuService } from '../../../menu.service';
import { MatDialog } from '@angular/material/dialog';
import {
  PromptDialogComponent,
  PromptFields,
} from '../../../../shared/dialogs/prompt-dialog/prompt-dialog.component';
import { FormControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
const COLS = ['index', 'image', 'title', 'price', 'status', 'actions'];
@Component({
  selector: 'app-product-table',
  standalone: true,
  imports: [CommonModule, SHARED, MatTableModule, MatChipsModule, MenuStatusChipComponent],
  templateUrl: './table.component.html',
  styleUrl: './table.component.scss',
})
export class ProductTableComponent {
  category = input<ProductCategory>();
  menu = inject(MenuService);
  dialog = inject(MatDialog);
  t = inject(TranslateService);
  readonly displayedColumns = COLS;

  changeProductStatus(product: Product, status: Status) {
    this.menu.saveProductMutation.mutate({ id: product.id, status });
  }

  changeProductVariantStatus(product: Product, variant: ProductVariant, status: Status) {
    const variants = product.variants.map((item) => (item.id !== variant.id ? item : { ...item, status }));
    this.menu.saveProductMutation.mutate({ id: product.id, variants });
  }

  changeProductPrice(product: Product) {
    const fields: PromptFields = {
      price: {
        label: this.t.instant('app.price'),
        control: new FormControl(product.price, Validators.required),
        hint: this.t.instant('app.currency'),
      },
    };
    this.dialog
      .open(PromptDialogComponent, {
        data: { title: product.title, fields },
      })
      .afterClosed()
      .subscribe((dto) => {
        if (dto) {
          this.menu.saveProductMutation.mutate({ id: product.id, price: dto.price });
        }
      });
  }

  changeProductVariantPrice(product: Product, variant: ProductVariant) {
    const fields: PromptFields = {
      price: {
        label: this.t.instant('app.price'),
        control: new FormControl(variant.price, Validators.required),
        hint: this.t.instant('app.currency'),
      },
    };
    this.dialog
      .open(PromptDialogComponent, {
        data: { title: `${product.title} ${variant.title}`, fields },
      })
      .afterClosed()
      .subscribe((dto) => {
        if (dto) {
          const variants = product.variants.map((item) =>
            item.id !== variant.id ? item : { ...item, price: dto.price },
          );
          this.menu.saveProductMutation.mutate({ id: product.id, variants });
        }
      });
  }
}
