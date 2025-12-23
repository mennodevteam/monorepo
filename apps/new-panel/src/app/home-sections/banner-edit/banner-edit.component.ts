import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { PlatformLocation } from '@angular/common';
import { SHARED } from '../../shared';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HomeSectionsService } from '../home-sections.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HomeSection, HomeSectionType, BannerConfig, BannerAspectRatio, BannerLink, BannerLinkType, Image, Product, ProductCategory } from '@menno/types';
import { MenuService } from '../../menu/menu.service';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatTableModule } from '@angular/material/table';
import { FormComponent } from '../../core/guards/dirty-form-deactivator.guard';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogService } from '../../core/services/dialog.service';
import { FilesService } from '../../core/services/files.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { CdkDrag, CdkDragDrop, CdkDropList, moveItemInArray } from '@angular/cdk/drag-drop';

type ImageValue = (Image & { file?: File }) | { base64: string; file: File } | null;

@Component({
  selector: 'app-banner-edit',
  standalone: true,
  imports: [
    SHARED,
    ReactiveFormsModule,
    MatToolbarModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatCheckboxModule,
    MatChipsModule,
    MatIconModule,
    MatSelectModule,
    MatOptionModule,
    MatTableModule,
    CdkDropList,
    CdkDrag,
    EmptyStateComponent,
  ],
  templateUrl: './banner-edit.component.html',
  styleUrl: './banner-edit.component.scss',
})
export class BannerEditComponent implements FormComponent {
  private readonly homeSectionsService = inject(HomeSectionsService);
  private readonly menuService = inject(MenuService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly location = inject(PlatformLocation);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(DialogService);
  private readonly filesService = inject(FilesService);
  private readonly snack = inject(MatSnackBar);
  private readonly t = inject(TranslateService);

  private readonly initialized = signal(false);
  private readonly sectionId = signal<string | null>(
    this.route.snapshot.paramMap.get('id') || null,
  );
  section = signal<HomeSection | null>(null);
  readonly BannerAspectRatio = BannerAspectRatio;
  readonly BannerLinkType = BannerLinkType;
  private previousAspectRatio: BannerAspectRatio = BannerAspectRatio.OneToOne;

  readonly form = this.fb.group({
    aspectRatio: this.fb.control<BannerAspectRatio>(BannerAspectRatio.OneToOne, {
      validators: [Validators.required],
      nonNullable: true,
    }),
    fullWidth: this.fb.control(false, { nonNullable: true }),
    images: this.fb.array<FormControl<ImageValue>>([]),
    links: this.fb.array<FormGroup<{
      type: FormControl<BannerLinkType>;
      categoryId: FormControl<number | null>;
      productId: FormControl<string | null>;
      externalUrl: FormControl<string>;
    }>>([]),
  });

  get imagesForm() {
    return this.form.controls.images;
  }

  get linksForm() {
    return this.form.controls.links;
  }

  readonly displayedColumns: string[] = ['image', 'linkType', 'linkValue', 'actions'];
  readonly dataSource = new MatTableDataSource<number>([]);

  readonly allCategories = computed(() => this.menuService.categories() || []);
  readonly allProducts = computed(() => {
    const categories = this.allCategories();
    const products: { product: Product; category: ProductCategory }[] = [];
    for (const cat of categories) {
      if (cat.products) {
        for (const product of cat.products) {
          products.push({ product, category: cat });
        }
      }
    }
    return products;
  });


  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.sectionId.set(params.get('id') || null);
      this.initialized.set(false);
    });

    effect(() => {
      const sections = this.homeSectionsService.homeSections();
      if (!sections || this.initialized()) return;

      // Try to get section from route state first (during navigation), then from service data
      const stateSection = this.router.getCurrentNavigation()?.extras?.state?.['section'] as HomeSection | undefined;
      
      const existing = stateSection || (this.sectionId()
        ? sections.find((item) => item.id === this.sectionId())
        : undefined);

      this.section.set(existing ?? null);

      const config = existing?.config as BannerConfig | undefined;

      // Clear arrays
      while (this.imagesForm.length) {
        this.imagesForm.removeAt(0);
      }
      while (this.linksForm.length) {
        this.linksForm.removeAt(0);
      }
      this.updateDataSource();

      // Populate images
      if (config?.images) {
        for (const image of config.images) {
          this.imagesForm.push(this.fb.control<ImageValue>(image as ImageValue, { nonNullable: true }));
        }
      }

      // Populate links
      if (config?.links) {
        for (const link of config.links) {
          this.linksForm.push(
            this.fb.group({
              type: this.fb.control<BannerLinkType>(link.type, { nonNullable: true }),
              categoryId: this.fb.control<number | null>(link.categoryId || null),
              productId: this.fb.control<string | null>(link.productId || null),
              externalUrl: this.fb.control<string>(link.externalUrl || ''),
            }) as FormGroup<{
              type: FormControl<BannerLinkType>;
              categoryId: FormControl<number | null>;
              productId: FormControl<string | null>;
              externalUrl: FormControl<string>;
            }>,
          );
        }
      }

      this.form.patchValue({
        aspectRatio: config?.aspectRatio || BannerAspectRatio.OneToOne,
        fullWidth: config?.fullWidth || false,
      });

      this.updateDataSource();
      this.form.markAsPristine();
      this.previousAspectRatio = this.form.controls.aspectRatio.value;
      this.initialized.set(true);
    });

    // Watch for aspect ratio changes
    this.form.controls.aspectRatio.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(async (newRatio) => {
        // Skip if not initialized yet or if it's the same value
        if (!this.initialized() || newRatio === this.previousAspectRatio) {
          return;
        }

        // If there are images, show confirmation dialog
        if (this.imagesForm.length > 0) {
          const confirmed = (await this.dialog.alert(
            this.t.instant('app.warning'),
            this.t.instant('homeSections.aspectRatioChangeWarning'),
          )) as boolean | undefined;

          if (confirmed) {
            // Remove all images
            while (this.imagesForm.length) {
              this.imagesForm.removeAt(0);
            }
            while (this.linksForm.length) {
              this.linksForm.removeAt(0);
            }
            this.updateDataSource();
            this.previousAspectRatio = newRatio;
            this.form.markAsDirty();
          } else {
            // Revert to previous aspect ratio
            this.form.controls.aspectRatio.setValue(this.previousAspectRatio, { emitEvent: false });
          }
        } else {
          // No images, just update the previous value
          this.previousAspectRatio = newRatio;
        }
      });
  }

  private updateDataSource() {
    this.dataSource.data = Array.from({ length: this.imagesForm.length }, (_, i) => i);
  }

  async addImage() {
    try {
      const aspectRatioValue = this.getAspectRatioValue(this.form.controls.aspectRatio.value);
      const res = await this.dialog.imageCropper({
        resizeToWidth: 1200,
        aspectRatio: aspectRatioValue,
      });
      
      if (res && res.base64 && res.file) {
        const imageValue: ImageValue = { base64: res.base64, file: res.file };
        this.imagesForm.push(this.fb.control<ImageValue>(imageValue, { nonNullable: true }));
        this.linksForm.push(
          this.fb.group({
            type: this.fb.control<BannerLinkType>(BannerLinkType.External, { nonNullable: true }),
            categoryId: this.fb.control<number | null>(null),
            productId: this.fb.control<string | null>(null),
            externalUrl: this.fb.control<string>(''),
          }) as FormGroup<{
            type: FormControl<BannerLinkType>;
            categoryId: FormControl<number | null>;
            productId: FormControl<string | null>;
            externalUrl: FormControl<string>;
          }>,
        );
        this.updateDataSource();
        this.form.markAsDirty();
      } else if (res === undefined || res === null) {
        // User cancelled - this is fine, just return
        return;
      } else {
        console.warn('Invalid image result:', res);
      }
    } catch (error) {
      console.error('Error adding image:', error);
      this.snack.open(this.t.instant('app.error'), '', { duration: 2000 });
    }
  }

  getAspectRatioValue(ratio: BannerAspectRatio): number {
    switch (ratio) {
      case BannerAspectRatio.OneToOne:
        return 1;
      case BannerAspectRatio.ThreeToOne:
        return 3;
      case BannerAspectRatio.ThreeToTwo:
        return 3 / 2;
      case BannerAspectRatio.TwoToThree:
        return 2 / 3;
      case BannerAspectRatio.OneToThree:
        return 1 / 3;
      default:
        return 3;
    }
  }

  deleteImage(index: number) {
    this.imagesForm.removeAt(index);
    if (this.linksForm.length > index) {
      this.linksForm.removeAt(index);
    }
    this.updateDataSource();
    this.form.markAsDirty();
  }

  moveImage(event: CdkDragDrop<number[]>) {
    moveItemInArray(this.imagesForm.controls, event.previousIndex, event.currentIndex);
    moveItemInArray(this.linksForm.controls, event.previousIndex, event.currentIndex);
    this.updateDataSource();
    this.form.markAsDirty();
  }

  isBase64ImageFile(value: ImageValue): value is { base64: string; file: File } {
    return value !== null && typeof value === 'object' && 'base64' in value;
  }

  getImageForDisplay(index: number): Image | undefined {
    const value = this.imagesForm.at(index).value;
    if (!value) return undefined;
    if (this.isBase64ImageFile(value)) return undefined;
    if ('md' in value) return value as Image;
    return undefined;
  }

  getBase64Image(index: number): string | undefined {
    const value = this.imagesForm.at(index).value;
    if (this.isBase64ImageFile(value)) {
      return value.base64;
    }
    return undefined;
  }

  async submit() {
    if (this.form.invalid) return;

    const fv = this.form.getRawValue();
    const links: BannerLink[] = [];
    for (const link of fv.links) {
      if (link.type === BannerLinkType.External && link.externalUrl?.trim()) {
        links.push({ type: BannerLinkType.External, externalUrl: link.externalUrl.trim() });
      } else if (link.type === BannerLinkType.Category && link.categoryId) {
        links.push({ type: BannerLinkType.Category, categoryId: link.categoryId });
      } else if (link.type === BannerLinkType.Product && link.productId) {
        links.push({ type: BannerLinkType.Product, productId: link.productId });
      }
    }

    const config: BannerConfig = {
      images: [],
      aspectRatio: fv.aspectRatio,
      fullWidth: fv.fullWidth,
      links: links.length > 0 ? links : undefined,
    };

    // Upload new images
    for (let i = 0; i < fv.images.length; i++) {
      const imageValue = fv.images[i];
      try {
        if (this.isBase64ImageFile(imageValue) && imageValue.file) {
          const snackRef = this.snack.open(this.t.instant('app.uploading'), '', { duration: 5000 });
          const savedFile = await this.filesService.upload(imageValue.file, 'banner');
          if (savedFile) {
            const imageFile = await this.filesService.saveFileImage(savedFile.key, 'banner');
            if (imageFile) {
              config.images.push(imageFile);
            }
          }
          snackRef.dismiss();
        } else if (imageValue && 'md' in imageValue && imageValue.md) {
          // Existing image
          config.images.push(imageValue as Image);
        }
      } catch (error) {
        console.error('Error uploading image:', error);
      }
    }

    const section: HomeSection = {
      id: this.sectionId() || undefined,
      type: HomeSectionType.Banner,
      config,
      position: 0,
      isVisible: true,
    } as HomeSection;

    await this.homeSectionsService.saveMutation.mutateAsync(section);
    this.form.markAsPristine();
    this.router.navigate(['/home-sections']);
  }

  canDeactivate() {
    return !this.form.dirty;
  }
}

