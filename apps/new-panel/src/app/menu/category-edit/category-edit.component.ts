import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { PlatformLocation } from '@angular/common';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MenuService } from '../menu.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Image, ProductCategory, MenuViewType, Menu } from '@menno/types';
import { FormComponent } from '../../core/guards/dirty-form-deactivator.guard';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogService } from '../../core/services/dialog.service';
import { FilesService } from '../../core/services/files.service';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

type CategoryImageValue = (Image & { file?: File }) | { base64: string; file: File } | null;

@Component({
  selector: 'app-category-edit',
  standalone: true,
  imports: [
    SHARED,
    ReactiveFormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    EmptyStateComponent
],
  templateUrl: './category-edit.component.html',
  styleUrl: './category-edit.component.scss',
})
export class CategoryEditComponent implements FormComponent {
  readonly menuService = inject(MenuService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly location = inject(PlatformLocation);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(DialogService);
  private readonly filesService = inject(FilesService);
  readonly MenuViewType = MenuViewType;

  private readonly initialized = signal(false);
  private readonly categoryId = signal<number | null>(
    this.route.snapshot.queryParamMap.get('id') ? Number(this.route.snapshot.queryParamMap.get('id')) : null,
  );
  category = signal<ProductCategory | null>(null);
  private isSubmitting = false;

  readonly form = this.fb.group({
    title: this.fb.control('', { validators: [Validators.required], nonNullable: true }),
    faIcon: this.fb.control(''),
    slug: this.fb.control('', {
      validators: [
        Validators.pattern(/^[a-z0-9-]*$/),
        this.slugUniquenessValidator.bind(this),
      ],
      nonNullable: false,
    }),
    description: this.fb.control(''),
    menuViewType: this.fb.control<MenuViewType | null>(null),
    imageFile: this.fb.control<CategoryImageValue>(null),
  });

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const idParam = params.get('id');
      this.categoryId.set(idParam ? Number(idParam) : null);
      this.initialized.set(false);
    });

    effect(() => {
      const categories = this.menuService.categories();
      if (!categories || this.initialized()) return;

      const existing = this.categoryId()
        ? categories.find((item) => item.id === this.categoryId())
        : undefined;

      this.category.set(existing ?? null);

      this.form.reset({
        title: existing?.title ?? '',
        faIcon: existing?.faIcon ?? '',
        slug: existing?.slug ?? '',
        description: existing?.description ?? '',
        menuViewType: existing?.menuViewType ?? null,
        imageFile: (existing?.imageFile as CategoryImageValue) ?? null,
      });

      this.form.markAsPristine();
      this.initialized.set(true);
    });

    const slugControl = this.form.controls.slug;
    slugControl?.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      if (value == null) return;
      const sanitized = this.sanitizeSlug(value);
      if (sanitized !== value) {
        slugControl.setValue(sanitized, { emitEvent: false });
      }
      // Note: Validation happens automatically via validators, no need to call updateValueAndValidity here
    });

    // Re-validate slug when categories change (only if slug has a value)
    effect(() => {
      const categories = this.menuService.categories();
      if (categories && this.initialized() && slugControl.value) {
        slugControl.updateValueAndValidity({ emitEvent: false });
      }
    });
  }

  async addImage() {
    const res = await this.dialog.imageCropper({
      format: 'png',
    });
    if (res) {
      this.form.controls.imageFile.setValue(res);
      this.form.controls.imageFile.markAsDirty();
    }
  }

  removeImage() {
    this.form.controls.imageFile.setValue(null);
    this.form.controls.imageFile.markAsDirty();
  }

  async submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const menuId = this.menuService.data()?.id;
    if (menuId == null) {
      return;
    }

    this.isSubmitting = true;
    const formValue = this.form.getRawValue();
    const dto: Partial<ProductCategory> = {
      title: formValue.title,
      faIcon: formValue.faIcon ?? undefined,
      slug: (this.buildFinalSlug(formValue.slug) ?? null) as string | undefined,
      description: formValue.description ?? undefined,
      menuViewType: formValue.menuViewType ?? undefined,
      imageFile: null,
      menu: { id: menuId } as Menu,
    };

    const existing = this.category();
    if (existing) {
      dto.id = existing.id;
    }

    const imageValue = formValue.imageFile;

    if (imageValue?.file) {
      try {
        const uploaded = await this.filesService.upload(imageValue.file, 'category');
        if (uploaded) {
          const savedImage = await this.filesService.saveFileImage(uploaded.key, 'category');
          if (savedImage) {
            dto.imageFile = savedImage;
          }
        }
      } catch {
        // ignore upload errors silently for now
      }
    } else if (imageValue) {
      dto.imageFile = imageValue as Image;
    } else {
      dto.imageFile = null;
    }

    this.menuService.saveCategoryMutation.mutate(dto);
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  canDeactivate() {
    return this.isSubmitting || !this.form.dirty;
  }

  isBase64ImageFile(image: CategoryImageValue): image is { base64: string; file: File } {
    return !!image && 'base64' in image;
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

    const categories = this.menuService.categories();
    if (!categories) return null;

    const currentCategoryId = this.category()?.id;
    const duplicate = categories.find(
      (cat) => cat.slug === value && cat.id !== currentCategoryId,
    );

    return duplicate ? { slugNotUnique: { title: duplicate.title } } : null;
  }
}
