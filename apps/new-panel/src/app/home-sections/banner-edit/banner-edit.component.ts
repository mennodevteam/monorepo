import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
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
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { HomeSectionsService } from '../home-sections.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HomeSection, HomeSectionType, BannerConfig, BannerAspectRatio, Image } from '@menno/types';
import { FormComponent } from '../../core/guards/dirty-form-deactivator.guard';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DialogService } from '../../core/services/dialog.service';
import { FilesService } from '../../core/services/files.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { MatGridListModule } from '@angular/material/grid-list';
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
    MatGridListModule,
    CdkDropList,
    CdkDrag,
    EmptyStateComponent,
  ],
  templateUrl: './banner-edit.component.html',
  styleUrl: './banner-edit.component.scss',
})
export class BannerEditComponent implements FormComponent {
  private readonly homeSectionsService = inject(HomeSectionsService);
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

  readonly form = this.fb.group({
    aspectRatio: this.fb.control<BannerAspectRatio>(BannerAspectRatio.OneToOne, {
      validators: [Validators.required],
      nonNullable: true,
    }),
    fullWidth: this.fb.control(false, { nonNullable: true }),
    images: this.fb.array<FormControl<ImageValue>>([]),
    links: this.fb.array<FormControl<string>>([]),
  });

  get imagesForm() {
    return this.form.controls.images;
  }

  get linksForm() {
    return this.form.controls.links;
  }

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.sectionId.set(params.get('id') || null);
      this.initialized.set(false);
    });

    effect(() => {
      const sections = this.homeSectionsService.homeSections();
      if (!sections || this.initialized()) return;

      const existing = this.sectionId()
        ? sections.find((item) => item.id === this.sectionId())
        : undefined;

      this.section.set(existing ?? null);

      const config = existing?.config as BannerConfig | undefined;

      // Clear arrays
      while (this.imagesForm.length) {
        this.imagesForm.removeAt(0);
      }
      while (this.linksForm.length) {
        this.linksForm.removeAt(0);
      }

      // Populate images
      if (config?.images) {
        for (const image of config.images) {
          this.imagesForm.push(this.fb.control<ImageValue>(image as ImageValue, { nonNullable: true }));
        }
      }

      // Populate links
      if (config?.links) {
        for (const link of config.links) {
          this.linksForm.push(this.fb.control(link, { nonNullable: true }));
        }
      }

      this.form.patchValue({
        aspectRatio: config?.aspectRatio || BannerAspectRatio.OneToOne,
        fullWidth: config?.fullWidth || false,
      });

      this.form.markAsPristine();
      this.initialized.set(true);
    });
  }

  addImage() {
    this.dialog
      .imageCropper({
        resizeToWidth: 1200,
        aspectRatio: this.form.controls.aspectRatio.value === BannerAspectRatio.OneToOne ? 1 : 3,
      })
      .then((res) => {
        if (res) {
          this.imagesForm.push(this.fb.control<ImageValue>(res, { nonNullable: true }));
          this.linksForm.push(this.fb.control('', { nonNullable: true }));
          this.form.markAsDirty();
        }
      });
  }

  deleteImage(index: number) {
    this.imagesForm.removeAt(index);
    if (this.linksForm.length > index) {
      this.linksForm.removeAt(index);
    }
    this.form.markAsDirty();
  }

  moveImage(event: CdkDragDrop<FormControl<ImageValue>[]>) {
    moveItemInArray(this.imagesForm.controls, event.previousIndex, event.currentIndex);
    moveItemInArray(this.linksForm.controls, event.previousIndex, event.currentIndex);
    this.form.markAsDirty();
  }

  isBase64ImageFile(value: ImageValue): value is { base64: string; file: File } {
    return value !== null && typeof value === 'object' && 'base64' in value;
  }

  async submit() {
    if (this.form.invalid) return;

    const fv = this.form.getRawValue();
    const config: BannerConfig = {
      images: [],
      aspectRatio: fv.aspectRatio,
      fullWidth: fv.fullWidth,
      links: fv.links.filter((l) => l.trim().length > 0),
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

