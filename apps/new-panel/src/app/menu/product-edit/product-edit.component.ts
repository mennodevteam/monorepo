import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
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
  ],
  templateUrl: './product-edit.component.html',
  styleUrl: './product-edit.component.scss',
})
export class ProductEditComponent {
  readonly menuService = inject(MenuService);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);
  private readonly dialog = inject(DialogService);
  private readonly t = inject(TranslateService);
  productId = this.route.snapshot.queryParams['id'];

  form: FormGroup;
  variantsForm: FormArray;
  hasVariant = signal(false);
  product = signal<Product | null>(null);

  constructor() {
    effect(() => {
      const menu = this.menuService.data();
      if (menu && !this.form) {
        const product = this.productId ? Menu.getProductById(menu, this.productId) : null;
        this.product.set(product);
        this.hasVariant.set(!!product?.variants?.length);
        const category = product
          ? this.menuService.categories()?.find((x) => x.products?.includes(product))
          : undefined;

        this.variantsForm = this.fb.array(
          product?.variants?.map((item) =>
            this.fb.group({
              title: [item.title, Validators.required],
              price: [item.price, Validators.required],
            }),
          ) || [],
        );

        this.form = this.fb.group({
          title: [product?.title, Validators.required],
          description: [product?.description],
          price: [product?.price, Validators.required],
          category: [category, Validators.required],
          variants: this.variantsForm,
          imageFiles: [product?.imageFiles || []],
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
}
