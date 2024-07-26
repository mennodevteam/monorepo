import { Component, Input } from '@angular/core';
import { OrderType, Product, ProductVariant, Status } from '@menno/types';
import { AlertDialogService } from '../../../../core/services/alert-dialog.service';
import { MenuService } from '../../../../core/services/menu.service';
import { MatDialog } from '@angular/material/dialog';
import { PromptDialogComponent } from '../../../../shared/dialogs/prompt-dialog/prompt-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import {
  AdvancedPromptDialogComponent,
  PromptKeyFields,
} from 'apps/panel/src/app/shared/dialogs/advanced-prompt-dialog/advanced-prompt-dialog.component';
import { FormControl, Validators } from '@angular/forms';
import { AlertDialogComponent } from 'apps/panel/src/app/shared/dialogs/alert-dialog/alert-dialog.component';
import { ImageCropperDialogComponent } from 'apps/panel/src/app/shared/dialogs/image-cropper-dialog/image-cropper-dialog.component';
import { CropperOptions } from 'ngx-image-cropper';
import { FilesService } from 'apps/panel/src/app/core/services/files.service';

@Component({
  selector: 'products-table',
  templateUrl: './products-table.component.html',
  styleUrls: ['./products-table.component.scss'],
})
export class ProductsTableComponent {
  displayedColumns = ['image', 'title', 'price', 'status', 'stock', 'actions'];
  @Input() products: Product[];
  Status = Status;
  OrderType = OrderType;

  abs = Math.abs;

  constructor(
    private alertDialog: AlertDialogService,
    private menuService: MenuService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private fileService: FilesService,
  ) {}

  deleteProduct(p: Product) {
    this.alertDialog.removeItem(p.title).then((v) => {
      if (v) {
        this.menuService.deleteProduct(p.id);
      }
    });
  }

  async changeStatus(product: Product, status: Status) {
    if (product.status !== status) {
      product._changingStatus = true;
      try {
        await this.menuService.saveProduct({ id: product.id, status });
        product.status = status;
      } catch (error) {
      } finally {
        product._changingStatus = false;
      }
    }
  }

  async changeStock(product: Product, infinity?: boolean) {
    let stock = infinity ? null : 0;
    if (!infinity) {
      const dto = await this.dialog
        .open(PromptDialogComponent, {
          data: {
            title: this.translate.instant('productTable.stockDialog.title', { value: product.title }),
            description: this.translate.instant('productTable.stockDialog.description'),
            type: 'number',
          },
        })
        .afterClosed()
        .toPromise();
      if (dto == undefined || dto < 0) return;
      stock = dto;
    }

    product._changingStatus = true;
    try {
      await this.menuService.saveProduct({ id: product.id, stock });
      product.stock = stock;
    } catch (error) {
    } finally {
      product._changingStatus = false;
    }
  }

  async variantClick(product: Product, variant: ProductVariant) {
    const fields: PromptKeyFields = {
      title: {
        label: this.translate.instant('app.title'),
        control: new FormControl(variant.title, Validators.required),
      },
      price: {
        label: this.translate.instant('app.price'),
        control: new FormControl(variant.price, Validators.required),
        type: 'number',
      },
    };
    const dto: ProductVariant = await this.dialog
      .open(AdvancedPromptDialogComponent, {
        data: {
          title: this.translate.instant('productEdit.variantDialog.editTitle', { value: variant.title }),
          fields,
        },
      })
      .afterClosed()
      .toPromise();

    if (dto) {
      variant._loading = true;
      variant.title = dto.title;
      variant.price = dto.price;
      const variants = product.variants.map(
        (item) => ({ id: item.id, title: item.title, price: item.price }) as ProductVariant,
      );
      await this.menuService.saveProduct({
        id: product.id,
        variants,
      });

      variant._loading = false;
    }
  }

  async priceClick(product: Product) {
    const price: number = await this.dialog
      .open(PromptDialogComponent, {
        data: {
          title: this.translate.instant('productEdit.editTitle', { value: product.title }),
          label: this.translate.instant('productTable.price'),
          value: product.price,
          type: 'number',
        },
      })
      .afterClosed()
      .toPromise();

    if (price != undefined) {
      product._priceLoading = true;
      await this.menuService.saveProduct({
        id: product.id,
        price,
      });
      product._priceLoading = false;
    }
  }

  imageClick(product: Product) {
    const spans = product.details.span;
    this.dialog
      .open(ImageCropperDialogComponent, {
        data: {
          resizeToWidth: 1200,
          aspectRatio: spans ? spans[0] / spans[1] : 1,
        } as CropperOptions,
      })
      .afterClosed()
      .subscribe(async (data) => {
        if (data) {
          const savedFile = await this.fileService.upload(data.file, 'product');
          if (savedFile) {
            const dto = { id: product.id } as Product;
            dto.images = [savedFile?.key];
            const imageFile = await this.fileService.saveFileImage(savedFile.key, 'product');
            if (imageFile) dto.imageFiles = [imageFile];
            this.menuService.saveProduct(dto);
          }
        }
      });
  }
}
