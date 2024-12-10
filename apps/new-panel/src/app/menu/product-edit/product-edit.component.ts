import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule, PlatformLocation } from '@angular/common';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MenuService } from '../menu.service';
import { ActivatedRoute } from '@angular/router';
import { Menu, Product, ProductCategory, ProductVariant } from '@menno/types';
import { DialogService } from '../../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray, CdkDragHandle } from '@angular/cdk/drag-drop';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FilesService } from '../../core/services/files.service';
import { FormComponent } from '../../core/guards/dirty-form-deactivator.guard';

@Component({
  selector: 'app-product-edit',
  standalone: true,
  imports: [
    CommonModule,
    SHARED,
    ReactiveFormsModule,
    MatToolbarModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatListModule,
    MatCardModule,
    MatGridListModule,
    CdkDropList,
    CdkDrag,
    MatTooltipModule,
    CdkDragHandle,
  ],
  templateUrl: './product-edit.component.html',
  styleUrl: './product-edit.component.scss',
})
export class ProductEditComponent implements FormComponent {
  readonly menuService = inject(MenuService);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(PlatformLocation);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(DialogService);
  private readonly snack = inject(MatSnackBar);
  private readonly fileService = inject(FilesService);
  private readonly t = inject(TranslateService);
  productId = this.route.snapshot.queryParams['id'];
  categoryId = this.route.snapshot.queryParams['categoryId'];

  form: FormGroup;
  variantsForm: FormArray;
  imagesForm: FormArray;
  product = signal<Product | null>(null);

  constructor() {
    effect(() => {
      const menu = this.menuService.data();
      if (menu && !this.form) {
        const product = this.productId ? Menu.getProductById(menu, this.productId) : null;
        this.product.set(product);
        let category: ProductCategory | undefined;

        if (product) {
          category = this.menuService.categories()?.find((x) => x.products?.includes(product));
        } else if (this.categoryId) {
          category = this.menuService.categories()?.find((x) => x.id.toString() === this.categoryId);
        }

        this.variantsForm = this.fb.array(
          product?.variants?.map((item) =>
            this.fb.group({
              id: [item.id],
              status: [item.status],
              position: [item.position],
              title: [item.title, Validators.required],
              price: [item.price, Validators.required],
            }),
          ) || [],
        );

        if (product) {
          this.imagesForm = this.fb.array(
            Array.isArray(product?.imageFiles)
              ? product?.imageFiles?.map((item) => this.fb.control(item, Validators.required))
              : [this.fb.control(product?.imageFiles, Validators.required)],
          );
        } else {
          this.imagesForm = this.fb.array([]);
        }

        this.form = this.fb.group({
          title: [product?.title, Validators.required],
          description: [product?.description],
          price: [product?.price, Validators.required],
          category: [category, Validators.required],
          variants: this.variantsForm,
          imageFiles: this.imagesForm,
        });
      }
    });
  }

  editVariant(variant?: AbstractControl) {
    this.dialog
      .prompt(variant?.value.title || this.t.instant('app.add'), {
        title: {
          control: new FormControl(variant?.value.title, Validators.required),
          label: this.t.instant('app.title'),
        },
        price: {
          control: new FormControl(variant?.value.price, Validators.required),
          label: this.t.instant('app.price'),
        },
      })
      .then((dto) => {
        if (variant) variant.setValue(dto);
        else
          this.variantsForm.push(
            this.fb.group({
              title: [dto.title, Validators.required],
              price: [dto.price, Validators.required],
            }),
          );
      });
  }

  addImage() {
    this.dialog.imageCropper().then((res) => {
      if (res) {
        this.imagesForm.push(this.fb.control(res, Validators.required));
        this.imagesForm.markAsDirty();
      }
    });
  }

  moveVariants(event: CdkDragDrop<any>) {
    moveItemInArray(this.variantsForm.controls, event.previousIndex, event.currentIndex);
    for (let i = 0; i < this.variantsForm.controls.length; i++) {
      const c = this.variantsForm.controls[i];
      c.setValue({ ...c.getRawValue(), position: i });
    }
    this.variantsForm.markAsDirty();
  }

  moveImage(event: CdkDragDrop<any>) {
    moveItemInArray(this.imagesForm.controls, event.previousIndex, event.currentIndex);
    this.imagesForm.markAsDirty();
  }

  setMainImage(index: number) {
    const control = this.imagesForm.controls.splice(index, 1);
    this.imagesForm.controls.unshift(control[0]);
    this.imagesForm.markAsDirty();
  }

  async deleteImage(index: number) {
    if (
      await this.dialog.alert(
        this.t.instant('productEdit.removeImage.title'),
        this.t.instant('productEdit.removeImage.description'),
      )
    ) {
      this.imagesForm.controls.splice(index, 1);
      this.imagesForm.markAsDirty();
    }
  }

  async deleteVariant(index: number) {
    if (
      await this.dialog.alert(
        this.t.instant('productEdit.removeVariant.title'),
        this.t.instant('productEdit.removeVariant.description'),
      )
    ) {
      this.variantsForm.controls.splice(index, 1);
      this.variantsForm.markAsDirty();
    }
  }

  async submit() {
    if (this.form.invalid) return;
    const fv = this.form.getRawValue();
    if (this.productId) fv.id = this.productId;
    fv.category = { id: fv.category.id };

    for (let i = 0; i < fv.imageFiles?.length; i++) {
      const imageFile = fv.imageFiles[i];
      try {
        if (imageFile.file) {
          const snackRef = this.snack.open(this.t.instant('app.uploading'), '', { duration: 5000 });
          const savedFile = await this.fileService.upload(imageFile.file, 'product');
          if (savedFile) {
            const imageFile = await this.fileService.saveFileImage(savedFile.key, 'product');
            fv.imageFiles[i] = imageFile;
          }
          snackRef.dismiss();
        }
      } catch (error) {
        //
      }
    }

    this.menuService.saveProductMutation.mutate(fv);
    this.form.reset();
    this.location.back();
  }

  canDeactivate() {
    return !this.form.dirty;
  }
}
