import { Component, effect, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule, PlatformLocation } from '@angular/common';
import { SHARED } from '../../shared';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';

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
import { Menu, Product, ProductCategory, ProductType, BillOfProduct, ProductVariant } from '@menno/types';
import { DialogService } from '../../core/services/dialog.service';
import { TranslateService } from '@ngx-translate/core';
import { CdkDragDrop, CdkDrag, CdkDropList, moveItemInArray, CdkDragHandle } from '@angular/cdk/drag-drop';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FilesService } from '../../core/services/files.service';
import { FormComponent } from '../../core/guards/dirty-form-deactivator.guard';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { startWith } from 'rxjs';

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
    MatAutocompleteModule,
    MatChipsModule,
    MatListModule,
    MatCardModule,
    MatGridListModule,
    CdkDropList,
    CdkDrag,
    MatTooltipModule,
    CdkDragHandle,
    MatSlideToggleModule,
    MatCheckboxModule,
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
  private readonly destroyRef = inject(DestroyRef);
  productId = this.route.snapshot.queryParams['id'];
  categoryId = this.route.snapshot.queryParams['categoryId'];

  form: FormGroup;
  variantsForm: FormArray;
  imagesForm: FormArray;
  readonly subcategoryInputControl = new FormControl('', { nonNullable: true });
  readonly subcategoryQuery = signal('');
  readonly separatorKeysCodes = [ENTER, COMMA] as const;
  product = signal<Product | null>(null);
  readonly allSubcategoryOptions = signal<string[]>([]);
  readonly relatedProductSearchControl = new FormControl('', { nonNullable: true });
  readonly relatedProductSearchQuery = toSignal(
    this.relatedProductSearchControl.valueChanges.pipe(startWith('')),
    { initialValue: '' }
  );

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
              price: [item.price],
              packItems: this.fb.array(
                item.packItems?.map((packItem) =>
                  this.fb.group({
                    id: [packItem.id],
                    productSource: [packItem.product, Validators.required],
                    variantSource: [packItem.variant],
                    quantity: [packItem.quantity ?? 1, [Validators.required, Validators.min(0.001)]],
                  })
                ) || []
              ),
            }),
          ) || [],
        );

        if (product) {
          this.imagesForm = this.fb.array(
            product?.imageFiles
              ? Array.isArray(product?.imageFiles)
                ? product?.imageFiles?.map((item) => this.fb.control(item, Validators.required))
                : [this.fb.control(product?.imageFiles, Validators.required)]
              : [],
          );
        } else {
          this.imagesForm = this.fb.array([]);
        }

        const hasInitVariants = !!(product?.variants && product.variants.length > 0);
        this.form = this.fb.group({
          title: [product?.title, Validators.required],
          description: [product?.description],
          type: [product?.type ?? ProductType.Standard, Validators.required],
          subcategories: [this.cleanSubcategories(product?.subcategories || [])],
          price: [product?.price ?? '', hasInitVariants || product?.type === ProductType.Pack ? [] : [Validators.required]],
          category: [category, Validators.required],
          hasVariants: [hasInitVariants],
          slug: [
            product?.slug ?? '',
            {
              validators: [
                Validators.pattern(/^[a-z0-9-]*$/),
                this.slugUniquenessValidator.bind(this),
              ],
              nonNullable: false,
            },
          ],
          variants: this.variantsForm,
          imageFiles: this.imagesForm,
          maxBasket: [product?.maxBasket],
          relatedProductIds: [product?.relatedProductIds ?? []],
          packItems: this.fb.array(
            product?.packItems?.map((packItem) =>
              this.fb.group({
                id: [packItem.id],
                productSource: [packItem.product, Validators.required],
                variantSource: [packItem.variant],
                quantity: [packItem.quantity ?? 1, [Validators.required, Validators.min(0.001)]],
              })
            ) || []
          ),
        });

        // Setup slug value changes handler
        const slugControl = this.form.controls['slug'];
        slugControl.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
          if (value == null) return;
          const sanitized = this.sanitizeSlug(value);
          if (sanitized !== value) {
            slugControl.setValue(sanitized, { emitEvent: false });
          }
        });

        // Setup dynamic validators for price based on hasVariants checkbox and product type
        const updatePriceValidators = () => {
          const priceCtrl = this.form.controls['price'];
          const hasVariants = this.form.controls['hasVariants'].value;
          const type = this.form.controls['type'].value;

          if (hasVariants || type === ProductType.Pack) {
            priceCtrl.clearValidators();
          } else {
            priceCtrl.setValidators(Validators.required);
          }
          priceCtrl.updateValueAndValidity();
        };

        this.form.controls['hasVariants'].valueChanges
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            updatePriceValidators();
            this.form.markAsDirty();
          });

        this.form.controls['type'].valueChanges
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            updatePriceValidators();
            this.form.markAsDirty();
          });

        // Re-validate slug when category changes
        this.form.controls['category'].valueChanges
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            if (slugControl.value) {
              slugControl.updateValueAndValidity({ emitEvent: false });
            }
          });

        this.subcategoryInputControl.valueChanges
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe((value) => this.subcategoryQuery.set(value ?? ''));
      }
    });

    effect(() => {
      const menu = this.menuService.data();
      if (!menu?.categories) {
        this.allSubcategoryOptions.set([]);
        return;
      }
      const values: string[] = [];
      for (const category of menu.categories as ProductCategory[]) {
        for (const product of (category.products || []) as Product[]) {
          values.push(...(product.subcategories || []));
        }
      }
      this.allSubcategoryOptions.set(this.cleanSubcategories(values));
    });
  }

  get subcategoriesControl() {
    return this.form?.controls['subcategories'] as FormControl<string[]>;
  }

  get filteredSubcategoryOptions() {
    const selected = new Set((this.subcategoriesControl?.value || []).map((item) => item.toLowerCase()));
    const query = this.subcategoryQuery().trim().toLowerCase();
    return this.allSubcategoryOptions()
      .filter((item) => !selected.has(item.toLowerCase()))
      .filter((item) => !query || item.toLowerCase().includes(query));
  }

  get relatedProductIdsControl() {
    return this.form?.controls['relatedProductIds'] as FormControl<string[]>;
  }

  get filteredRelatedProducts(): { product: Product; category: { title: string } }[] {
    const menu = this.menuService.data();
    if (!menu?.categories || !this.form) return [];
    const selectedIds = (this.relatedProductIdsControl?.value || []) as string[];
    const currentProductId = this.product()?.id;
    const searchQuery = (this.relatedProductSearchQuery() ?? '').trim().toLowerCase();
    const result: { product: Product; category: { title: string } }[] = [];
    for (const cat of menu.categories as ProductCategory[]) {
      if (!cat.products) continue;
      for (const p of cat.products as Product[]) {
        if (p.id === currentProductId) continue;
        if (selectedIds.includes(p.id)) continue;
        if (searchQuery && !p.title.toLowerCase().includes(searchQuery)) continue;
        result.push({ product: p, category: { title: cat.title } });
      }
    }
    return result;
  }

  getRelatedProductById(id: string): Product | undefined {
    const menu = this.menuService.data();
    return menu ? (Menu.getProductById(menu, id) ?? undefined) : undefined;
  }

  getCategoryForProduct(productId: string): string | undefined {
    const menu = this.menuService.data();
    if (!menu?.categories) return undefined;
    for (const cat of menu.categories as ProductCategory[]) {
      if (cat.products?.some((p: Product) => p.id === productId)) return cat.title;
    }
    return undefined;
  }

  selectRelatedProduct(item: { product: Product; category: { title: string } }) {
    const control = this.relatedProductIdsControl;
    if (!control) return;
    const current = (control.value || []) as string[];
    if (!current.includes(item.product.id)) {
      control.setValue([...current, item.product.id]);
      control.markAsDirty();
    }
    this.relatedProductSearchControl.setValue('');
  }

  removeRelatedProduct(productId: string) {
    const control = this.relatedProductIdsControl;
    if (!control) return;
    const current = (control.value || []) as string[];
    control.setValue(current.filter((id) => id !== productId));
    control.markAsDirty();
  }

  moveRelatedProduct(event: CdkDragDrop<string[]>) {
    const control = this.relatedProductIdsControl;
    if (!control) return;
    const current = [...((control.value || []) as string[])];
    moveItemInArray(current, event.previousIndex, event.currentIndex);
    control.setValue(current);
    control.markAsDirty();
  }

  editVariant(variant?: AbstractControl) {
    const isPack = this.form.controls['type'].value === ProductType.Pack;
    const prompts: any = {
      title: {
        control: new FormControl(variant?.value.title, Validators.required),
        label: this.t.instant('app.title'),
      },
    };
    if (!isPack) {
      prompts.price = {
        control: new FormControl(variant?.value.price, Validators.required),
        label: this.t.instant('app.price'),
      };
    }

    this.dialog
      .prompt(variant?.value.title || this.t.instant('app.add'), prompts)
      .then((dto) => {
        if (variant) {
          variant.setValue({ ...variant.value, ...dto });
        } else {
          this.variantsForm.push(
            this.fb.group({
              title: [dto.title, Validators.required],
              price: [isPack ? 0 : dto.price, isPack ? [] : [Validators.required]],
              packItems: this.fb.array([]),
            }),
          );
        }
        this.variantsForm.markAsDirty();
        this.form.markAsDirty();
      });
  }

  compareFn(a: any, b: any): boolean {
    return a && b ? a.id === b.id : a === b;
  }

  getPackItemsFormArray(variant?: AbstractControl): FormArray {
    if (variant) {
      return variant.get('packItems') as FormArray;
    }
    return this.form.get('packItems') as FormArray;
  }

  addPackItemFromAutocomplete(product: Product, variantControl?: AbstractControl) {
    const childVariant = product.variants?.length ? product.variants[0] : undefined;
    this.addPackItemToForm(product, childVariant, variantControl);
  }

  addPackItemToForm(product: Product, childVariant?: ProductVariant, variantControl?: AbstractControl) {
    const packItemsArray = this.getPackItemsFormArray(variantControl);
    const exists = packItemsArray.controls.some((c) => {
      const pSrc = c.value.productSource;
      const vSrc = c.value.variantSource;
      return pSrc?.id === product.id && vSrc?.id === childVariant?.id;
    });

    if (exists) return;

    packItemsArray.push(
      this.fb.group({
        productSource: [product, Validators.required],
        variantSource: [childVariant],
        quantity: [1, [Validators.required, Validators.min(0.001)]],
      })
    );
    packItemsArray.markAsDirty();
    this.form.markAsDirty();
  }

  removePackItemFromForm(index: number, variantControl?: AbstractControl) {
    const packItemsArray = this.getPackItemsFormArray(variantControl);
    packItemsArray.removeAt(index);
    packItemsArray.markAsDirty();
    this.form.markAsDirty();
  }

  getAvailableProductsForPack(): Product[] {
    const menu = this.menuService.data();
    if (!menu?.categories) return [];
    const currentProductId = this.product()?.id;
    const list: Product[] = [];
    for (const cat of menu.categories) {
      if (cat.products) {
        for (const p of cat.products) {
          if (p.id !== currentProductId) {
            list.push(p);
          }
        }
      }
    }
    return list;
  }

  filteredProductsForSearch(query: string): Product[] {
    const q = (query || '').toLowerCase().trim();
    const all = this.getAvailableProductsForPack();
    if (!q) return all.slice(0, 10);
    return all.filter((p) => p.title.toLowerCase().includes(q));
  }

  getPackItemPrice(itemVal: any): number {
    const p = itemVal.productSource;
    if (!p) return 0;
    const v = itemVal.variantSource;
    return v ? (v.price || 0) : (p.price || 0);
  }

  getPackItemsTotalPrice(packItemsArray: FormArray): number {
    return packItemsArray.controls.reduce((acc, c) => acc + this.getPackItemPrice(c.value) * (c.value.quantity || 0), 0);
  }

  addImage() {
    this.dialog.imageCropper().then((res) => {
      if (res) {
        this.imagesForm.push(this.fb.control(res, Validators.required));
        this.imagesForm.markAsDirty();
      }
    });
  }
  moveVariants(event: CdkDragDrop<AbstractControl[]>) {
    moveItemInArray(this.variantsForm.controls, event.previousIndex, event.currentIndex);
    for (let i = 0; i < this.variantsForm.controls.length; i++) {
      const c = this.variantsForm.controls[i];
      c.setValue({ ...c.getRawValue(), position: i });
    }
    this.variantsForm.markAsDirty();
  }

  moveImage(event: CdkDragDrop<AbstractControl[]>) {
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

  duplicateVariant(index: number) {
    const originalVariantGroup = this.variantsForm.at(index) as FormGroup;
    if (!originalVariantGroup) return;

    const originalValue = originalVariantGroup.getRawValue();

    // Map duplicated packItems
    const duplicatedPackItems = this.fb.array(
      (originalValue.packItems || []).map((packItem: any) =>
        this.fb.group({
          productSource: [packItem.productSource, Validators.required],
          variantSource: [packItem.variantSource],
          quantity: [packItem.quantity ?? 1, [Validators.required, Validators.min(0.001)]],
        })
      )
    );

    const duplicatedVariantGroup = this.fb.group({
      status: [originalValue.status],
      position: [this.variantsForm.length],
      title: [`${originalValue.title} (کپی)`, Validators.required],
      price: [originalValue.price],
      packItems: duplicatedPackItems,
    });

    this.variantsForm.push(duplicatedVariantGroup);
    this.variantsForm.markAsDirty();
    this.form.markAsDirty();
  }
  async submit() {
    const hasVariants = this.form.controls['hasVariants'].value;
    const isPack = this.form.controls['type'].value === ProductType.Pack;
    if (hasVariants || isPack) {
      this.form.controls['price'].setValue(0);
    } else {
      if (!this.form.controls['price'].value) this.form.controls['price'].setValue(0);
    }
    if (this.form.invalid) return;
    const fv = this.form.getRawValue();

    const mapPackItems = (itemsList: any[]) => {
      return (itemsList || []).map((b) => ({
        id: b.id,
        product: { id: b.productSource.id },
        variant: b.variantSource ? { id: b.variantSource.id } : null,
        quantity: Number(b.quantity),
      }));
    };

    if (isPack) {
      fv.price = 0;
      if (hasVariants) {
        fv.packItems = [];
        for (const v of fv.variants) {
          v.price = 0;
          v.packItems = mapPackItems(v.packItems);
        }
      } else {
        fv.variants = [];
        fv.packItems = mapPackItems(fv.packItems);
      }
    } else {
      fv.packItems = [];
      if (hasVariants) {
        for (const v of fv.variants) {
          v.packItems = [];
        }
      } else {
        fv.variants = [];
      }
    }

    if (this.productId) fv.id = this.productId;
    fv.category = { id: fv.category.id };
    fv.slug = this.buildFinalSlug(fv.slug) ?? null;
    fv.subcategories = this.cleanSubcategories(fv.subcategories || []);
    fv.relatedProductIds = (fv.relatedProductIds ?? []).filter((id: string) => !!id);

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

  addSubcategoryFromInput(event: MatChipInputEvent) {
    this.addSubcategory(event.value || '');
    event.chipInput?.clear();
    this.subcategoryInputControl.setValue('');
  }

  selectSubcategory(event: MatAutocompleteSelectedEvent) {
    this.addSubcategory(event.option.value);
    this.subcategoryInputControl.setValue('');
  }

  removeSubcategory(index: number) {
    const current = [...(this.subcategoriesControl?.value || [])];
    if (index < 0 || index >= current.length) return;
    current.splice(index, 1);
    this.subcategoriesControl.setValue(current);
    this.subcategoriesControl.markAsDirty();
  }

  private sanitizeSlug(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/-{2,}/g, '-');
  }

  private buildFinalSlug(value?: string | null) {
    if (!value) return undefined;
    const sanitized = this.sanitizeSlug(value);
    const trimmed = sanitized.replace(/(^-+)|(-+$)/g, '');
    return trimmed || undefined;
  }

  private slugUniquenessValidator(control: AbstractControl) {
    const value = control.value;
    if (!value) return null;

    const menu = this.menuService.data();
    if (!menu || !menu.categories) return null;

    const currentProductId = this.product()?.id;

    // Check for duplicate slug across ALL products in ALL categories
    for (const category of menu.categories) {
      if (category.products) {
        const duplicate = category.products.find(
          (prod) => prod.slug === value && prod.id !== currentProductId,
        );
        if (duplicate) {
          return { slugNotUnique: { title: duplicate.title } };
        }
      }
    }

    return null;
  }

  private addSubcategory(value: string) {
    const normalized = this.normalizeSubcategory(value);
    if (!normalized) return;

    const current = this.cleanSubcategories(this.subcategoriesControl?.value || []);
    if (current.some((item) => item.toLowerCase() === normalized.toLowerCase())) return;

    this.subcategoriesControl.setValue([...current, normalized]);
    this.subcategoriesControl.markAsDirty();
  }

  private cleanSubcategories(values: string[]) {
    const result: string[] = [];
    const seen = new Set<string>();
    for (const value of values) {
      const normalized = this.normalizeSubcategory(value);
      if (!normalized) continue;
      const key = normalized.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(normalized);
    }
    return result;
  }

  private normalizeSubcategory(value?: string | null) {
    return value?.trim() || '';
  }

  canDeactivate() {
    return !this.form.dirty;
  }
}
